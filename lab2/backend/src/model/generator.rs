use rand::random;
use super::Time;

pub trait Generator {
    fn last_event(&self) -> Time;
    fn next_event(&self) -> Time;
    fn advance(&mut self, time_override: Option<Time>);
}

pub struct RayleighGenerator {
    last_event: Time,
    next_event: Time,
    sigma: f64
}

impl RayleighGenerator {
    fn rayleigh_sample(sigma: f64) -> f64 {
        f64::sqrt(-2.0 * sigma * sigma * f64::ln(1.0 - random::<f64>()))
    }

    pub fn new(sigma: f64) -> Self {
        let last_event = Self::rayleigh_sample(sigma);
        Self {
            last_event,
            next_event: last_event + Self::rayleigh_sample(sigma),
            sigma
        }
    }
}

impl Generator for RayleighGenerator {
    fn last_event(&self) -> Time {
        self.last_event
    }

    fn next_event(&self) -> Time {
        self.next_event
    }

    fn advance(&mut self, time_override: Option<Time>) {
        self.last_event = if let Some(time) = time_override {
            time
        } else {
            self.next_event
        };
        self.next_event = self.last_event + Self::rayleigh_sample(self.sigma);
    }
}
