use crate::model::Time;

#[derive(serde::Serialize)]
pub struct ModelResult {
    pub request_total: usize,
    pub requests_handled: usize,
    pub requests_in_queue: usize,
    pub queue_time_avg: Time,
    pub load_avg: Time
}
