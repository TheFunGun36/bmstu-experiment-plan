use crate::{model::Time, planned_experiment::EXPERIMENT_COUNT};

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

#[derive(serde::Deserialize)]
pub struct ActiveExperimentTable {
    pub model_time: Time,
    pub iterations: usize,
    pub svc_intensity_begin: f64,
    pub svc_intensity_end: f64,
    pub svc_sigma_begin: f64,
    pub svc_sigma_end: f64,
    pub gen_intensity_begin: f64,
    pub gen_intensity_end: f64,
}

#[derive(serde::Deserialize)]
pub struct ActiveExperimentSingle {
    pub model_time: Time,
    pub iterations: usize,
    pub svc_intensity_point: f64,
    pub svc_intensity_begin: f64,
    pub svc_intensity_end: f64,
    pub svc_sigma_point: f64,
    pub svc_sigma_begin: f64,
    pub svc_sigma_end: f64,
    pub gen_intensity_point: f64,
    pub gen_intensity_begin: f64,
    pub gen_intensity_end: f64,
    pub b: [f64; EXPERIMENT_COUNT],
}
