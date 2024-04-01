use crate::{model::Time, planned_experiment::EXPERIMENT_COUNT};

#[derive(serde::Serialize)]
pub struct ModelResult {
    pub request_total: usize,
    pub requests_handled: usize,
    pub requests_in_queue: usize,
    pub queue_time_avg: Time,
    pub load_avg: Time,
}

#[derive(serde::Serialize)]
pub struct QueueTimeAndLoadFromServiceMean {
    pub queue_time_spread: Vec<f64>,
    pub load_spread: Vec<f64>,
}

#[derive(serde::Serialize)]
pub struct QueueTimeAndLoadFromGeneratorSigma {
    pub queue_time_spread: Vec<f64>,
    pub load_spread: Vec<f64>,
}

#[derive(serde::Serialize)]
pub struct ActiveExperimentTableRecord {
    pub x0: f64,
    pub x1: f64,
    pub x2: f64,
    pub x3: f64,
    pub x12: f64,
    pub x13: f64,
    pub x23: f64,
    pub x123: f64,
    pub y: f64,
    pub yl: f64,
    pub yn: f64,
    pub yld: f64,
    pub ynd: f64,
}

#[derive(serde::Serialize)]
pub struct ActiveExperimentTable {
    pub b: [f64; EXPERIMENT_COUNT],
    pub matrix: [ActiveExperimentTableRecord; EXPERIMENT_COUNT]
}
