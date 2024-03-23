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
        const response = await axios.post('/model', p);
        setFetchResult(response.data as ModelResultDTO);
    }

    return [fetchState, fetchResult, getModelResult];
}
