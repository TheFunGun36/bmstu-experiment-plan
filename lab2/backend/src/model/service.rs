use super::Time;
use rand_distr::{Distribution, LogNormal};

pub trait Service {
    fn was_busy_for(&self) -> Time;
    fn last_event(&self) -> Time;
    fn next_event(&self) -> Time;
    fn advance(&mut self, time_override: Option<Time>);
}

pub struct NormalService {
    last_event: Time,
    next_event: Time,
    busy_time: Time,
    distribution: LogNormal<f64>,
}

impl NormalService {
    fn distribution_sample(&self) -> f64 {
        self.distribution.sample(&mut rand::thread_rng())
    }

    pub fn new(mu: f64, sigma: f64) -> Self {
        let distribution = LogNormal::new(mu, sigma).unwrap();
        let last_event = 0.0;
        let next_event = 0.0;
        Self {
            last_event,
            next_event,
            busy_time: 0.0,
            distribution,
        }
    }
}

impl Service for NormalService {
    fn was_busy_for(&self) -> Time {
        self.busy_time
    }

    fn last_event(&self) -> Time {
        self.last_event
    }

    fn next_event(&self) -> Time {
        self.next_event
    }

    fn advance(&mut self, time_override: Option<Time>) {
        self.busy_time += self.next_event - self.last_event;
        self.last_event = if let Some(time) = time_override {
            time
        } else {
            self.next_event
        };
        self.next_event = self.last_event + self.distribution_sample();
    }
}
