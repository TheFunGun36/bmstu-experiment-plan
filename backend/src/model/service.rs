use std::{cell::RefCell, rc::Rc};

use super::{SharedService, Time};
use rand_distr::{Distribution, LogNormal};

pub trait Service {
    fn was_busy_for(&self) -> Time;
    fn last_event(&self) -> Time;
    fn next_event(&self) -> Time;
    fn advance(&mut self, time_override: Option<Time>);
    fn dyn_clone(&self) -> SharedService;
    fn reset(&mut self);
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

    fn actual_mu(m: f64, s: f64) -> f64 {
        f64::ln(m) - s * s / 2.0
    }

    fn actual_sigma (m: f64, s: f64) -> f64 {
        f64::sqrt(
            f64::ln(
            0.5 *
            f64::exp(-2.0 * m) *
            (
                f64::sqrt(
                    4.0 * f64::exp(2.0 * m) * s +
                    f64::exp(4.0 * m)
                ) +
                f64::exp(2.0 * m)
            )
            )
        )
    }

    pub fn new(mu: f64, sigma: f64) -> Self {
        let s = Self::actual_sigma(mu, sigma);
        let m = Self::actual_mu(mu, s);
        let distribution = LogNormal::new(m, s).unwrap();
        let last_event = 0.0;
        let next_event = 0.0;
        Self {
            last_event,
            next_event,
            busy_time: 0.0,
            distribution,
        }
    }

    pub fn new_shared(mu: f64, sigma: f64) -> Rc<RefCell<Self>> {
        Rc::new(RefCell::new(Self::new(mu, sigma)))
    }

    pub fn i2p(i: f64) -> f64 {
        1.0 / i
    }

    pub fn from_intensity(i: f64, sigma: f64) -> Self {
        Self::new(Self::i2p(i), sigma)
    }

    pub fn shared_from_intensity(i: f64, sigma: f64) -> Rc<RefCell<Self>> {
        Rc::new(RefCell::new(Self::from_intensity(i, sigma)))
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

    fn dyn_clone(&self) -> SharedService {
        Rc::new(RefCell::new(Self {
            busy_time: self.busy_time,
            distribution: self.distribution.clone(),
            last_event: self.last_event,
            next_event: self.next_event
        }))
    }

    fn reset(&mut self) {
        self.last_event = 0.0;
        self.next_event = 0.0;
        self.busy_time = 0.0;
    }
}
