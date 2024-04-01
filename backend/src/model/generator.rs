use super::{SharedGenerator, Time};
use rand::random;
use std::{cell::RefCell, f64::consts::PI, rc::Rc};

pub trait Generator {
    fn last_event(&self) -> Time;
    fn next_event(&self) -> Time;
    fn advance(&mut self, time_override: Option<Time>);
    fn dyn_clone(&self) -> SharedGenerator;
    fn reset(&mut self);
}

pub struct RayleighGenerator {
    last_event: Time,
    next_event: Time,
    sigma: f64,
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
            sigma,
        }
    }

    pub fn new_shared(sigma: f64) -> Rc<RefCell<Self>> {
        Rc::new(RefCell::new(Self::new(sigma)))
    }

    fn i2p(i: f64) -> f64 {
        1.0 / (f64::sqrt(PI / 2.0) * i)
    }

    fn p2i(sigma: f64) -> f64 {
        1.0 / (f64::sqrt(PI / 2.0) * sigma)
    }

    pub fn from_intensity(intensity: f64) -> Self {
        Self::new(Self::i2p(intensity))
    }

    pub fn shared_from_intensity(intensity: f64) -> Rc<RefCell<Self>> {
        Rc::new(RefCell::new(Self::from_intensity(intensity)))
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

    fn dyn_clone(&self) -> SharedGenerator {
        Rc::new(RefCell::new(Self {
            last_event: self.last_event,
            next_event: self.next_event,
            sigma: self.sigma,
        }))
    }

    fn reset(&mut self) {
        self.last_event = Self::rayleigh_sample(self.sigma);
        self.next_event = self.last_event + Self::rayleigh_sample(self.sigma);
    }
}
