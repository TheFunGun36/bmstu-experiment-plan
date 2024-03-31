pub mod request;
pub mod response;

use crate::model::{generator::RayleighGenerator, service::NormalService, Model, Time};
use axum::debug_handler;
use axum::Json;
use futures::stream::FuturesOrdered;
use futures::StreamExt;
use std::{cell::RefCell, rc::Rc};

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

                println!("\tFinished srv: {service_mean}, gen: {sigma}. Time: {request_queue_time}");

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
                let model_params = crate::model::ModelParams {
                    model_time,
                };

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
                println!("\tFinished srv: {mean}, gen: {generator_sigma}. Time: {request_queue_time}");

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
