import axios from "axios";
import { useState } from "react";

axios.defaults.baseURL = 'http://localhost:3000'

export enum FetchState {
    DEFAULT = 'DEFAULT',
    LOADING = 'LOADING',
    SUCCESS = 'SUCCESS',
    ERROR = 'ERROR'
}

export type ExperimentParamsDTO = {
    model_time: number,
    iterations: number,
    svc_intensity_begin: number,
    svc_intensity_end: number,
    svc_sigma_begin: number,
    svc_sigma_end: number,
    gen_intensity_begin: number,
    gen_intensity_end: number,
}

export type ExperimentParamsSingleDTO = {
    model_time: number,
    iterations: number,
    svc_intensity_point: number,
    svc_intensity_begin: number,
    svc_intensity_end: number,
    svc_sigma_point: number,
    svc_sigma_begin: number,
    svc_sigma_end: number,
    gen_intensity_point: number,
    gen_intensity_begin: number,
    gen_intensity_end: number,
    b: number[]
}

export type ExperimentRecord = {
    x0: number,
    x1: number,
    x2: number,
    x3: number,
    x12: number,
    x13: number,
    x23: number,
    x123: number,
    y: number,
    yl: number,
    yn: number,
    yld: number,
    ynd: number,
}

export type ExperimentResultDTO = {
    matrix: ExperimentRecord[],
    b: number[]
}
export function useActiveExperiment(): [FetchState, ExperimentResultDTO | undefined, (p: ExperimentParamsDTO) => Promise<void>] {
    const [fetchState, setFetchState] = useState(FetchState.DEFAULT);
    const [fetchResult, setFetchResult] = useState<ExperimentResultDTO>();

    const getModelResult = async (p: ExperimentParamsDTO) => {
        setFetchState(FetchState.LOADING);
        const response = await axios.post('/model/experiment', p);
        if (response.status == 200) {
            setFetchResult(response.data as ExperimentResultDTO);
            setFetchState(FetchState.SUCCESS);
        }
        else {
            setFetchState(FetchState.ERROR);
        }
    }

    return [fetchState, fetchResult, getModelResult];
}

export function useActiveSingle(): [FetchState, ExperimentRecord | undefined, (p: ExperimentParamsSingleDTO) => Promise<void>] {
    const [fetchState, setFetchState] = useState(FetchState.DEFAULT);
    const [fetchResult, setFetchResult] = useState<ExperimentRecord>();

    const getModelResult = async (p: ExperimentParamsSingleDTO) => {
        setFetchState(FetchState.LOADING);
        const response = await axios.post('/model/experiment_single', p);
        if (response.status == 200) {
            setFetchResult(response.data as ExperimentRecord);
            setFetchState(FetchState.SUCCESS);
        }
        else {
            setFetchState(FetchState.ERROR);
        }
    }

    return [fetchState, fetchResult, getModelResult];
}
