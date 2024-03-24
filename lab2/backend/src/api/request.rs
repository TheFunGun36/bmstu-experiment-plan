use crate::model::Time;

#[derive(serde::Deserialize)]
pub struct ModelParams {
    pub generator_sigma: f64,
    pub service_sigma: f64,
    pub service_mean: f64,
    pub model_time: Time
}

#[derive(serde::Deserialize)]
pub struct QueueTimeAndLoadFromServiceMean {
    pub iteration_per_point: usize,
    pub generator_sigma: f64,
    pub service_sigma: f64,
    pub service_mean_spread: Vec<f64>,
    pub model_time: Time,
}

#[derive(serde::Deserialize)]
pub struct QueueTimeAndLoadFromGeneratorSigma {
    pub iteration_per_point: usize,
    pub generator_sigma_spread: Vec<f64>,
    pub service_sigma: f64,
    pub service_mean: f64,
    pub model_time: Time,
}
