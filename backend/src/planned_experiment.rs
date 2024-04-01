use std::{
    borrow::Borrow,
    io::{stdout, Write},
};

use ndarray_linalg::Inverse;

use crate::model::{generator::RayleighGenerator, service::NormalService, Model, ModelParams};

pub const PARAMS_COUNT: usize = 3;

/// 2^3
pub const EXPERIMENT_COUNT: usize = 8;
const XMIN: f64 = -1.0;
const XMAX: f64 = 1.0;

pub type ParamRange = (f64, f64);

type PlannedExperimentSingle = [f64; EXPERIMENT_COUNT];

pub struct PlannedExperimentResult {
    pub b: [f64; EXPERIMENT_COUNT],
    pub y: [f64; EXPERIMENT_COUNT],
    pub y_linear: [f64; EXPERIMENT_COUNT],
    pub y_non_linear: [f64; EXPERIMENT_COUNT],
}

pub struct PlannedExperimentResultSingle {
    pub xrow: [f64; EXPERIMENT_COUNT],
    pub y: f64,
    pub y_linear: f64,
    pub y_non_linear: f64,
    pub y_linear_delta: f64,
    pub y_non_linear_delta: f64,
}

impl PlannedExperimentResult {
    pub fn y_linear_delta(&self, i: usize) -> f64 {
        (self.y[i] - self.y_linear[i]).abs()
    }

    pub fn y_non_linear_delta(&self, i: usize) -> f64 {
        (self.y[i] - self.y_non_linear[i]).abs()
    }
}

pub fn x12(row: &PlannedExperimentSingle) -> f64 {
    row[1] * row[2]
}
pub fn x13(row: &PlannedExperimentSingle) -> f64 {
    row[1] * row[3]
}
pub fn x23(row: &PlannedExperimentSingle) -> f64 {
    row[2] * row[3]
}
pub fn x123(row: &PlannedExperimentSingle) -> f64 {
    row[1] * row[2] * row[3]
}

fn bool_to_val(b: bool) -> f64 {
    if b {
        1.0
    } else {
        -1.0
    }
}

pub struct PlannedExperimentMatrix {
    experiments: [PlannedExperimentSingle; EXPERIMENT_COUNT],
    model_params: ModelParams,
}

impl PlannedExperimentMatrix {
    pub fn new(model_params: ModelParams) -> Self {
        let mut experiments = [[1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]; EXPERIMENT_COUNT];

        for i in 0..EXPERIMENT_COUNT {
            experiments[i][1] = bool_to_val(i & 4 != 0);
            experiments[i][2] = bool_to_val(i & 2 != 0);
            experiments[i][3] = bool_to_val(i & 1 != 0);
            experiments[i][4] = x12(&experiments[i]);
            experiments[i][5] = x13(&experiments[i]);
            experiments[i][6] = x23(&experiments[i]);
            experiments[i][7] = x123(&experiments[i]);
        }

        Self {
            experiments,
            model_params,
        }
    }

    fn xmat(&self) -> ndarray::Array2<f64> {
        let mtx = ndarray::arr2(&self.experiments);
        mtx.t().dot(&mtx).inv().unwrap().dot(&mtx.t())
    }

    fn linear(b: &[f64; EXPERIMENT_COUNT], x: &PlannedExperimentSingle) -> f64 {
        b[..PARAMS_COUNT + 1]
            .iter()
            .enumerate()
            .map(|(i, v)| v * x[i])
            .sum()
    }

    fn non_linear(b: &[f64; EXPERIMENT_COUNT], x: &PlannedExperimentSingle) -> f64 {
        b.iter().enumerate().map(|(i, v)| v * x[i]).sum()
    }

    /// param ranges:
    /// 1. gen intensity
    /// 2. svc intensity
    /// 3. svc sigma
    pub fn run(
        &self,
        iterations: usize,
        param_ranges: [ParamRange; PARAMS_COUNT],
    ) -> PlannedExperimentResult {
        let mut y = [0.0; EXPERIMENT_COUNT];

        print!("\t[");
        for (i, experiment) in self.experiments.iter().enumerate() {
            let mut model = Model::new(self.model_params.clone());
            let gen_intensity = Self::scale(experiment[1], param_ranges[0]);
            let svc_intensity = Self::scale(experiment[2], param_ranges[1]);
            let svc_sigma = Self::scale(experiment[3], param_ranges[2]);

            let svc = NormalService::shared_from_intensity(svc_intensity, svc_sigma);
            let gen = RayleighGenerator::shared_from_intensity(gen_intensity);

            model.add_service(svc);
            model.add_generator(gen);

            let mut load_sum = 0.0;
            for _ in 0..iterations {
                load_sum += model.start().load_avg;
                model.reset();
            }

            y[i] = load_sum / iterations as f64;
            print!("\r\t[");
            for j in 0..i {
                print!("#")
            }
            for j in 0..EXPERIMENT_COUNT - 1 - i {
                print!(" ")
            }
            print!("]");
            let _ = stdout().flush();
        }

        let xmat: ndarray::Array2<f64> = self.xmat();

        let mut b = [0.0; EXPERIMENT_COUNT];
        for i in 0..EXPERIMENT_COUNT {
            let mut b_cur = 0.0;
            for j in 0..EXPERIMENT_COUNT {
                b_cur += xmat[[i, j]] * y[j];
            }
            b[i] = b_cur;
        }

        let mut y_linear = [0.0; EXPERIMENT_COUNT];
        let mut y_non_linear = [0.0; EXPERIMENT_COUNT];
        for i in 0..EXPERIMENT_COUNT {
            y_linear[i] = Self::linear(&b, &self.experiments[i]);
            y_non_linear[i] = Self::non_linear(&b, &self.experiments[i]);
        }

        PlannedExperimentResult {
            b,
            y,
            y_linear,
            y_non_linear,
        }
    }

    /// param ranges:
    /// 1. gen intensity
    /// 2. svc intensity
    /// 3. svc sigma
    pub fn run_single(
        &self,
        iterations: usize,
        gen_intensity: f64,
        svc_intensity: f64,
        svc_sigma: f64,
        param_ranges: [ParamRange; PARAMS_COUNT],
        b: [f64; EXPERIMENT_COUNT]
    ) -> PlannedExperimentResultSingle {
        let mut model = Model::new(self.model_params.clone());

        let svc = NormalService::shared_from_intensity(svc_intensity, svc_sigma);
        let gen = RayleighGenerator::shared_from_intensity(gen_intensity);

        model.add_service(svc);
        model.add_generator(gen);

        let mut load_sum = 0.0;
        for _ in 0..iterations {
            load_sum += model.start().load_avg;
            model.reset();
        }

        let y = load_sum / iterations as f64;

        let mut xrow: PlannedExperimentSingle = [
            1.0,
            Self::scale_inv(gen_intensity, param_ranges[0]),
            Self::scale_inv(svc_intensity, param_ranges[1]),
            Self::scale_inv(svc_sigma, param_ranges[2]),
            0.0,
            0.0,
            0.0,
            0.0
        ];
        xrow[4] = x12(&xrow);
        xrow[5] = x13(&xrow);
        xrow[6] = x23(&xrow);
        xrow[7] = x123(&xrow);

        let y_linear = Self::linear(&b, &xrow);
        let y_non_linear = Self::non_linear(&b, &xrow);

        PlannedExperimentResultSingle {
            xrow,
            y,
            y_linear,
            y_non_linear,
            y_linear_delta: (y - y_linear).abs(),
            y_non_linear_delta: (y - y_non_linear).abs()
        }
    }

    // почему просто не сделать одной проверкой (типа = -1 или =1 (условно, там ещё проще можно)) я хз
    fn scale(x: f64, r: ParamRange) -> f64 {
        r.0 + (r.1 - r.0) * (x - XMIN) / (XMAX - XMIN)
    }

    fn scale_inv(x: f64, r: ParamRange) -> f64 {
        let center = (r.1 + r.0) / 2.0;
        let len = (r.1 - r.0) / 2.0;
        (x - center) / len
    }

    pub fn take_experiments(self) -> [PlannedExperimentSingle; EXPERIMENT_COUNT] {
        self.experiments
    }
}
