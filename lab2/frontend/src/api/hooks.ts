import axios from "axios";
import { useState } from "react";

export enum FetchState {
    DEFAULT = 'DEFAULT',
    LOADING = 'LOADING',
    SUCCESS = 'SUCCESS',
    ERROR = 'ERROR'
}

export type ModelParamsDTO = {
    generator_sigma: number,
    service_sigma: number,
    service_mean: number,
    model_time: number
}

export type ModelResultDTO = {
    request_total: number,
    requests_handled: number,
    requests_in_queue: number,
    queue_time_avg: number,
    load_avg: number
}

axios.defaults.baseURL = 'http://localhost:3000'

export function useModel(): [FetchState, ModelResultDTO | undefined, (p: ModelParamsDTO) => Promise<void>] {
    const [fetchState, setFetchState] = useState(FetchState.DEFAULT);
    const [fetchResult, setFetchResult] = useState<ModelResultDTO>();

    const getModelResult = async (p: ModelParamsDTO) => {
        setFetchState(FetchState.LOADING);
        const response = await axios.post('/model', p);
        if (response.status == 200) {
            setFetchResult(response.data as ModelResultDTO);
            setFetchState(FetchState.SUCCESS);
        }
        else {
            setFetchState(FetchState.ERROR);
        }
    }

    return [fetchState, fetchResult, getModelResult];
}

export type SvcSpreadDTO = {
    queue_time_spread: number[],
    load_spread: number[]
}

export type SvcSpreadParamsDTO = {
    iteration_per_point: number,
    generator_sigma: number,
    service_sigma: number,
    service_mean_spread: number[],
    model_time: number,
}

export function useSvcSpread(): [FetchState, SvcSpreadDTO | undefined, (p: SvcSpreadParamsDTO) => Promise<void>] {
    const [fetchState, setFetchState] = useState(FetchState.DEFAULT);
    const [fetchResult, setFetchResult] = useState<SvcSpreadDTO>();

    const getModelResult = async (p: SvcSpreadParamsDTO) => {
        setFetchState(FetchState.LOADING);
        const response = await axios.post('/model/service_spread', p);
        if (response.status == 200) {
            setFetchResult(response.data as SvcSpreadDTO);
            setFetchState(FetchState.SUCCESS);
        }
        else {
            setFetchState(FetchState.ERROR);
        }
    }

    return [fetchState, fetchResult, getModelResult];
}

export type GenSpreadDTO = {
    queue_time_spread: number[],
    load_spread: number[]
}

export type GenSpreadParamsDTO = {
    iteration_per_point: number,
    generator_sigma_spread: number[],
    service_sigma: number,
    service_mean: number,
    model_time: number,
}

export function useGenSpread(): [FetchState, GenSpreadDTO | undefined, (p: GenSpreadParamsDTO) => Promise<void>] {
    const [fetchState, setFetchState] = useState(FetchState.DEFAULT);
    const [fetchResult, setFetchResult] = useState<GenSpreadDTO>();

    const getModelResult = async (p: GenSpreadParamsDTO) => {
        setFetchState(FetchState.LOADING);
        const response = await axios.post('/model/generator_spread', p);
        if (response.status == 200) {
            setFetchResult(response.data as GenSpreadDTO);
            setFetchState(FetchState.SUCCESS);
        }
        else {
            setFetchState(FetchState.ERROR);
        }
    }

    return [fetchState, fetchResult, getModelResult];
}
