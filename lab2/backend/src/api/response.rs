use crate::model::Time;

#[derive(serde::Serialize)]
pub struct ModelResult {
    pub request_total: usize,
    pub requests_handled: usize,
    pub requests_in_queue: usize,
    pub queue_time_avg: Time,
    pub load_avg: Time
}

#[derive(serde::Serialize)]
pub struct QueueTimeAndLoadFromServiceMean {
    pub queue_time_spread: Vec<f64>,
    pub load_spread: Vec<f64>
}

#[derive(serde::Serialize)]
pub struct QueueTimeAndLoadFromGeneratorSigma {
    pub queue_time_spread: Vec<f64>,
    pub load_spread: Vec<f64>
}
