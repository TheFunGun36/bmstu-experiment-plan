pub mod generator;
pub mod service;
pub mod unit;

use generator::Generator;
use service::Service;
use std::collections::{BinaryHeap, VecDeque};
use unit::Unit;

pub type Time = f64;
type SharedGenerator = std::rc::Rc<std::cell::RefCell<dyn Generator>>;
type SharedService = std::rc::Rc<std::cell::RefCell<dyn Service>>;

pub struct Model {
    generators: Vec<SharedGenerator>,
    services: Vec<SharedService>,
    params: ModelParams,
}

impl Clone for Model {
    fn clone(&self) -> Self {
        Self {
            generators: self.generators.iter().map(|v| v.borrow().dyn_clone()).collect(),
            services: self.services.iter().map(|v| v.borrow().dyn_clone()).collect(),
            params: self.params.clone(),
        }
    }
}

#[derive(Clone)]
pub struct ModelParams {
    pub model_time: Time,
}

pub struct ModelResult {
    pub requests_total: usize,
    pub requests_handled: usize,
    pub request_queue_time: Time,
    pub load_avg: f64,
}

impl Model {
    pub fn new(params: ModelParams) -> Self {
        Self {
            generators: Vec::<SharedGenerator>::new(),
            services: Vec::<SharedService>::new(),
            params,
        }
    }

    pub fn add_service(&mut self, svc: SharedService) {
        self.services.push(svc);
    }

    pub fn add_generator(&mut self, svc: SharedGenerator) {
        self.generators.push(svc);
    }

    pub fn reset(&mut self) {
        self.generators.iter().for_each(|el| el.borrow_mut().reset());
        self.services.iter().for_each(|el| el.borrow_mut().reset());
    }

    pub fn start(&self) -> ModelResult {
        let mut units: BinaryHeap<Unit> = self
            .generators
            .iter()
            .map(|g| Unit::Gen(g.clone()))
            .collect();
        let mut idle_services: VecDeque<SharedService> =
            self.services.iter().map(|s| s.clone()).collect();
        let mut event_queue = VecDeque::<Time>::new();

        let mut requests_total: usize = 0;
        let mut requests_handled: usize = 0;
        let mut request_queue_time: Time = 0.0;

        while units.peek().unwrap().next_event() < self.params.model_time {
            let unit = units.pop().unwrap();
            match unit {
                Unit::Gen(gen) => {
                    requests_total += 1;
                    let gen_time = gen.borrow().next_event();

                    if let Some(svc) = idle_services.pop_front() {
                        svc.borrow_mut().advance(Some(gen_time));
                        units.push(Unit::Svc(svc));
                    } else {
                        event_queue.push_back(gen_time);
                    }

                    gen.borrow_mut().advance(None);
                    units.push(Unit::Gen(gen));
                }
                Unit::Svc(svc) => {
                    let svc_time = svc.borrow().next_event();
                    requests_handled += 1;

                    if let Some(timestamp) = event_queue.pop_front() {
                        request_queue_time += svc_time - timestamp;
                        svc.borrow_mut().advance(None);
                        units.push(Unit::Svc(svc));
                    } else {
                        idle_services.push_back(svc);
                    }
                }
            }
        }

        let busy_time_sum = self
            .services
            .iter()
            .map(|svc| svc.borrow().was_busy_for())
            .sum::<Time>();
        let busy_time_avg = busy_time_sum / self.services.len() as Time;
        ModelResult {
            request_queue_time,
            requests_total,
            requests_handled,
            load_avg: busy_time_avg / self.params.model_time,
        }
    }
}
