use std::{cell::RefCell, rc::Rc};

use axum::Json;
use axum::debug_handler;
use crate::model::{generator::RayleighGenerator, service::NormalService, Model, Time};

pub mod request;
pub mod response;

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

    Json(response::ModelResult {
        request_total: res.requests_total,
        requests_handled: res.requests_handled,
        requests_in_queue: res.requests_total - res.requests_handled,
        queue_time_avg: res.request_queue_time / res.requests_handled as Time,
        load_avg: res.load_avg
    })
}
