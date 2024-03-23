use crate::model::Time;

#[derive(serde::Deserialize)]
pub struct ModelParams {
    pub generator_sigma: f64,
    pub service_sigma: f64,
    pub service_mean: f64,
    pub model_time: Time
}
