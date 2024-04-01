pub mod request;
pub mod response;

use crate::model::{generator::RayleighGenerator, service::NormalService, Model, Time};
use crate::planned_experiment::{PlannedExperimentMatrix, EXPERIMENT_COUNT};
use axum::debug_handler;
use axum::Json;
use futures::stream::FuturesOrdered;
use futures::StreamExt;
use std::mem::{transmute, MaybeUninit};
use std::{cell::RefCell, rc::Rc};

#[debug_handler]
pub async fn active_experiment(
    params: Json<request::ActiveExperimentTable>,
) -> Json<response::ActiveExperimentTable> {
    println!("active_experiment request received");
    let active_experiment = PlannedExperimentMatrix::new(crate::model::ModelParams {
        model_time: params.model_time,
    });
    let param_ranges = [
        (params.gen_intensity_begin, params.gen_intensity_end),
        (params.svc_intensity_begin, params.svc_intensity_end),
        (params.svc_sigma_begin, params.svc_sigma_end),
    ];
    let result = active_experiment.run(params.iterations, param_ranges);
    let experiments = active_experiment.take_experiments();

    let mut matrix: [MaybeUninit<response::ActiveExperimentTableRecord>; EXPERIMENT_COUNT] =
        unsafe { MaybeUninit::uninit().assume_init() };
    for (i, el) in matrix.iter_mut().enumerate() {
        el.write(response::ActiveExperimentTableRecord {
            x0: experiments[i][0],
            x1: experiments[i][1],
            x2: experiments[i][2],
            x3: experiments[i][3],
            x12: experiments[i][4],
            x13: experiments[i][5],
            x23: experiments[i][6],
            x123: experiments[i][7],
            y: result.y[i],
            yl: result.y_linear[i],
            yn: result.y_non_linear[i],
            yld: result.y_linear_delta(i),
            ynd: result.y_non_linear_delta(i),
        });
    }
    println!("\n\tactive_experiment request finished");

    unsafe {
        Json(response::ActiveExperimentTable {
            matrix: transmute::<_, [response::ActiveExperimentTableRecord; EXPERIMENT_COUNT]>(
                matrix,
            ),
            b: result.b,
        })
    }
}

#[debug_handler]
pub async fn active_experiment_single(
    params: Json<request::ActiveExperimentSingle>,
) -> Json<response::ActiveExperimentTableRecord> {
    println!("active_experiment request received");
    let active_experiment = PlannedExperimentMatrix::new(crate::model::ModelParams {
        model_time: params.model_time,
    });
    let param_ranges = [
        (params.gen_intensity_begin, params.gen_intensity_end),
        (params.svc_intensity_begin, params.svc_intensity_end),
        (params.svc_sigma_begin, params.svc_sigma_end),
    ];
    let result = active_experiment.run_single(
        params.iterations,
        params.gen_intensity_point,
        params.svc_intensity_point,
        params.svc_sigma_point,
        param_ranges,
        params.b
    );

    Json(response::ActiveExperimentTableRecord {
        x0: result.xrow[0],
        x1: result.xrow[1],
        x2: result.xrow[2],
        x3: result.xrow[3],
        x12: result.xrow[4],
        x13: result.xrow[5],
        x23: result.xrow[6],
        x123: result.xrow[7],
        y: result.y,
        yl: result.y_linear,
        yn: result.y_non_linear,
        yld: result.y_linear_delta,
        ynd: result.y_non_linear_delta,
    })
}

#[debug_handler]
pub async fn model_single(params: Json<request::ModelParams>) -> Json<response::ModelResult> {
    let gen = RayleighGenerator::new(params.generator_sigma);
    let svc = NormalService::new(params.service_mean, params.service_sigma);

    let model_params = crate::model::ModelParams {
        model_time: params.model_time,
    };

    let mut model = Model::new(model_params);
    model.add_generator(Rc::new(RefCell::new(gen)));
    model.add_service(Rc::new(RefCell::new(svc)));

    println!("single model run:");
    println!("\tmodel time: {}", params.model_time);
    println!("\tgenerator σ: {}", params.generator_sigma);
    println!("\tservice σ: {}", params.service_sigma);
    println!("\tservice mean: {}", params.service_mean);
    let res = model.start();
    println!("\tfinished");

    let queue_time_avg = if res.requests_handled == 0 {
        0.0
    } else {
        res.request_queue_time / res.requests_handled as Time
    };

    Json(response::ModelResult {
        request_total: res.requests_total,
        requests_handled: res.requests_handled,
        requests_in_queue: res.requests_total - res.requests_handled,
        queue_time_avg,
        load_avg: res.load_avg,
    })
}

#[debug_handler]
pub async fn model_spread_from_generator(
    params: Json<request::QueueTimeAndLoadFromGeneratorSigma>,
) -> Json<response::QueueTimeAndLoadFromGeneratorSigma> {
    let (queue_time_spread, load_spread): (Vec<f64>, Vec<f64>) = params
        .generator_sigma_spread
        .iter()
        .map(|gen_sigma| {
            let model_time = params.model_time;
            let service_sigma = params.service_sigma;
            let service_mean = params.service_mean;
            let iteration_per_point = params.iteration_per_point;
            let sigma = *gen_sigma;
            tokio::spawn(async move {
                let model_params = crate::model::ModelParams {
                    model_time: model_time,
                };

                let mut model = Model::new(model_params);
                let svc = NormalService::new(service_mean, service_sigma);
                let gen = RayleighGenerator::new(sigma);
                model.add_service(Rc::new(RefCell::new(svc)));
                model.add_generator(Rc::new(RefCell::new(gen)));

                println!("Started srv: {service_mean}, gen: {sigma}...");
                let mut request_queue_time = 0.0;
                let mut load_avg = 0.0;
                for _ in 0..iteration_per_point {
                    let res = model.start();
                    request_queue_time += res.request_queue_time;
                    load_avg += res.load_avg;
                    model.reset();
                }

                request_queue_time /= iteration_per_point as f64;
                load_avg /= iteration_per_point as f64;

                println!(
                    "\tFinished srv: {service_mean}, gen: {sigma}. Time: {request_queue_time}"
                );

                (request_queue_time, load_avg)
            })
        })
        .map(|e| async { e.await.unwrap() })
        .collect::<FuturesOrdered<_>>()
        .collect::<Vec<(f64, f64)>>()
        .await
        .into_iter()
        .unzip();

    Json(response::QueueTimeAndLoadFromGeneratorSigma {
        load_spread,
        queue_time_spread,
    })
}

#[debug_handler]
pub async fn model_spread_from_service(
    params: Json<request::QueueTimeAndLoadFromServiceMean>,
) -> Json<response::QueueTimeAndLoadFromServiceMean> {
    let (queue_time_spread, load_spread): (Vec<f64>, Vec<f64>) = params
        .service_mean_spread
        .iter()
        .map(|svc_mean| {
            let model_time = params.model_time;
            let service_sigma = params.service_sigma;
            let generator_sigma = params.generator_sigma;
            let iteration_per_point = params.iteration_per_point;
            let mean = *svc_mean;
            tokio::spawn(async move {
                let model_params = crate::model::ModelParams { model_time };

                let mut model = Model::new(model_params);
                let svc = NormalService::new(mean, service_sigma);
                let gen = RayleighGenerator::new(generator_sigma);
                model.add_service(Rc::new(RefCell::new(svc)));
                model.add_generator(Rc::new(RefCell::new(gen)));

                println!("Started srv: {mean}, gen: {generator_sigma}...");
                let mut request_queue_time = 0.0;
                let mut load_avg = 0.0;
                for _ in 0..iteration_per_point {
                    let res = model.start();
                    request_queue_time += res.request_queue_time;
                    load_avg += res.load_avg;
                    model.reset();
                }

                request_queue_time /= iteration_per_point as f64;
                load_avg /= iteration_per_point as f64;
                println!(
                    "\tFinished srv: {mean}, gen: {generator_sigma}. Time: {request_queue_time}"
                );

                (request_queue_time, load_avg)
            })
        })
        .map(|e| async { e.await.unwrap() })
        .collect::<FuturesOrdered<_>>()
        .collect::<Vec<(f64, f64)>>()
        .await
        .into_iter()
        .unzip();

    Json(response::QueueTimeAndLoadFromServiceMean {
        load_spread,
        queue_time_spread,
    })
}
