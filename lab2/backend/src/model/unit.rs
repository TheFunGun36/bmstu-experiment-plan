use std::cmp::Ordering;
use super::{SharedGenerator, SharedService, Time};

pub enum Unit {
    Gen(SharedGenerator),
    Svc(SharedService),
}

// Костылим, ждём пока в Rust завезут апкаст трейтов
impl Unit {
    pub fn last_event(&self) -> Time {
        match self {
            Unit::Gen(g) => g.borrow().last_event(),
            Unit::Svc(s) => s.borrow().last_event(),
        }
    }

    pub fn next_event(&self) -> Time {
        match self {
            Unit::Gen(g) => g.borrow().next_event(),
            Unit::Svc(s) => s.borrow().next_event(),
        }
    }

    pub fn advance(&mut self, time_override: Option<Time>) {
        match self {
            Unit::Gen(g) => g.borrow_mut().advance(time_override),
            Unit::Svc(s) => s.borrow_mut().advance(time_override),
        }
    }
}

impl PartialEq for Unit {
    fn eq(&self, other: &Self) -> bool {
        match (self, other) {
            (Self::Gen(l0), Self::Gen(r0)) => l0.borrow().next_event() == r0.borrow().next_event(),
            (Self::Svc(l0), Self::Svc(r0)) => l0.borrow().next_event() == r0.borrow().next_event(),
            _ => false,
        }
    }
}

impl Eq for Unit {}

impl PartialOrd for Unit {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        self.next_event().partial_cmp(&other.next_event()).and_then(|e| Some(e.reverse()))
    }
}

impl Ord for Unit {
    fn cmp(&self, other: &Self) -> Ordering {
        self.next_event().partial_cmp(&other.next_event()).expect("NOOOO, DIZ NAN's").reverse()
    }
}
