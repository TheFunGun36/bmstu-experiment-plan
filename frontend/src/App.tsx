import { Box, Button, Card, CircularProgress, LinearProgress, Paper, ThemeProvider, Typography } from '@mui/material';
import { useState } from 'react';
import { theme } from './theme';
import FloatInput from './components/FloatInput';
import ExperimentTable, { Row } from './components/ExperimentTable';
import { ExperimentParamsDTO, ExperimentParamsSingleDTO, ExperimentRecord, FetchState, useActiveExperiment, useActiveSingle } from './api/hooks';

function dtoToRow(row: ExperimentRecord, i: number): Row {
  const res: Row = {
    id: i,
    x0: row.x0,
    x1: row.x1,
    x2: row.x2,
    x3: row.x3,
    x1x2: row.x12,
    x1x3: row.x13,
    x2x3: row.x23,
    x1x2x3: row.x123,
    y: row.y,
    yl: row.yl,
    ynl: row.yn,
    dyl: row.yld,
    dynl: row.ynd
  };
  return res;
}

function dtoToRowIf(row?: ExperimentRecord, i?: number): Row | undefined {
  if (row && i)
    return dtoToRow(row, i);
}

function fmt(i: number) {
  if (i < 0)
    return i.toFixed(4);
  return '+' + i.toFixed(4);
}

function App() {
  const [fetchState, fetchResult, postExperimentRequest] = useActiveExperiment();
  const [fetchStateSingle, fetchResultSingle, postExperimentRequestSingle] = useActiveSingle();
  const experimentMatrix = fetchResultSingle ?
    fetchResult?.matrix.map((e, i) => dtoToRow(e, i + 1)).concat(dtoToRow(fetchResultSingle, 0))
    : fetchResult?.matrix.map((e, i) => dtoToRow(e, i + 1));

  const [modelTime, setModelTime] = useState<number>(0);

  const [genIntensityBegin, setGenIntensityBegin] = useState<number>(0);
  const [svcSigmaBegin, setSvcSigmaBegin] = useState<number>(0);
  const [svcIntensityBegin, setSvcIntensityBegin] = useState<number>(0);

  const [genIntensityEnd, setGenIntensityEnd] = useState<number>(0);
  const [svcSigmaEnd, setSvcSigmaEnd] = useState<number>(0);
  const [svcIntensityEnd, setSvcIntensityEnd] = useState<number>(0);

  const [genIntensityPoint, setGenIntensityPoint] = useState<number>(0);
  const [svcSigmaPoint, setSvcSigmaPoint] = useState<number>(0);
  const [svcIntensityPoint, setSvcIntensityPoint] = useState<number>(0);

  const valid = (n: number) => !isNaN(n) && n >= 0 && n !== 0;
  const validAll = () => valid(modelTime)
    && valid(genIntensityBegin)
    && valid(svcSigmaBegin)
    && valid(svcIntensityBegin)
    && valid(genIntensityEnd)
    && valid(svcSigmaEnd)
    && valid(svcIntensityEnd);

  // Param To Intensity and
  // Intensity To Param converts
  const genP2I = (sigma: number) => 1 / (Math.sqrt(Math.PI / 2) * sigma);
  const genI2P = (intensity: number) => 1 / (Math.sqrt(Math.PI / 2) * intensity);
  const svcP2I = (mean: number) => 1 / mean;
  const svcI2P = (intensity: number) => 1 / intensity;

  const onRequestExperiment = async () => {
    const experiment_params: ExperimentParamsDTO = {
      gen_intensity_begin: genIntensityBegin,
      gen_intensity_end: genIntensityEnd,
      iterations: 100,
      model_time: modelTime,
      svc_intensity_begin: svcIntensityBegin,
      svc_intensity_end: svcIntensityEnd,
      svc_sigma_begin: svcSigmaBegin,
      svc_sigma_end: svcSigmaEnd
    }
    await postExperimentRequest(experiment_params);
  }

  const onPointCheck = async () => {
    if (!fetchResult)
      return;
    const params: ExperimentParamsSingleDTO = {
      gen_intensity_begin: genIntensityBegin,
      gen_intensity_end: genIntensityEnd,
      iterations: 100,
      model_time: modelTime,
      svc_intensity_begin: svcIntensityBegin,
      svc_intensity_end: svcIntensityEnd,
      svc_sigma_begin: svcSigmaBegin,
      svc_sigma_end: svcSigmaEnd,
      b: fetchResult.b,
      gen_intensity_point: genIntensityPoint,
      svc_intensity_point: svcIntensityPoint,
      svc_sigma_point: svcSigmaPoint
    }
    await postExperimentRequestSingle(params);
  }

  return (
    <ThemeProvider theme={theme}>
      <Box display='flex' flexDirection='column' alignItems='center'>
        <Typography variant='h3' align='center'>Лабораборная работа №2</Typography>
        <Box display='flex' flexDirection='row'>
          <Paper variant='outlined' sx={{ margin: 'auto', m: 1 }}>
            <Card elevation={4} variant='elevation' sx={{ display: 'flex', flexDirection: 'column', m: 1, p: 1 }}>
              <Typography>Параметры генератора (распределение Рэлея)</Typography>
              <Box display='flex'>
                <FloatInput
                  label='Интенсивность нач. (x1)'
                  errorText='Интенсивность может быть только положительным числом, отличным от нуля'
                  valConverted={genI2P(genIntensityBegin)}
                  valHintText='σ='
                  setVal={setGenIntensityBegin}
                  valid={valid}
                />
                <FloatInput
                  label='Интенсивность кон. (x1)'
                  errorText='Интенсивность может быть только положительным числом, отличным от нуля'
                  valConverted={genI2P(genIntensityEnd)}
                  valHintText='σ='
                  setVal={setGenIntensityEnd}
                  valid={valid}
                />
              </Box>
            </Card>
            <Card elevation={4} variant='elevation' sx={{ display: 'flex', flexDirection: 'column', m: 1, p: 1 }}>
              <Typography>Параметры обработчика (нормальное распределение)</Typography>
              <Box display='flex'>
                <FloatInput
                  label='Интенсивность нач. (x2)'
                  errorText='Интенсивность может быть только положительным числом, отличным от нуля'
                  setVal={setSvcIntensityBegin}
                  valConverted={svcI2P(svcIntensityBegin)}
                  valHintText='M='
                  valid={valid}
                />
                <FloatInput
                  label='Интенсивность кон. (x2)'
                  errorText='Интенсивность может быть только положительным числом, отличным от нуля'
                  setVal={setSvcIntensityEnd}
                  valConverted={svcI2P(svcIntensityEnd)}
                  valHintText='M='
                  valid={valid}
                />
              </Box>
              <Box display='flex'>
                <FloatInput
                  label='σ нач. (x3)'
                  errorText='σ может быть только положительным числом, отличным от нуля'
                  setVal={setSvcSigmaBegin}
                  valid={valid}
                />
                <FloatInput
                  label='σ кон. (x3)'
                  errorText='σ может быть только положительным числом, отличным от нуля'
                  setVal={setSvcSigmaEnd}
                  valid={valid}
                />
              </Box>
            </Card>
            <Card elevation={4} variant='elevation' sx={{ display: 'flex', flexDirection: 'column', m: 1, p: 1 }}>
              <Box alignItems='center' display='flex'>
                <FloatInput
                  label='Время моделирования'
                  errorText='Время моделирования может быть только положительное число, отличное от нуля'
                  setVal={setModelTime}
                  valid={valid}
                />
              </Box>
            </Card>
          </Paper>
          {experimentMatrix &&
            <Paper variant='outlined' sx={{ margin: 'auto', m: 1 }}>
              <Typography variant='h5' m={1}>Проверка в точке</Typography>
              <Card elevation={4} variant='elevation' sx={{ display: 'flex', flexDirection: 'column', m: 1, p: 1 }}>
                <Typography>Параметры генератора (распределение Рэлея)</Typography>
                <Box display='flex'>
                  <FloatInput
                    label='Интенсивность (x1)'
                    errorText='Интенсивность может быть только положительным числом, отличным от нуля'
                    valConverted={genI2P(genIntensityPoint)}
                    valHintText='σ='
                    setVal={setGenIntensityPoint}
                    valid={valid}
                  />
                </Box>
              </Card>
              <Card elevation={4} variant='elevation' sx={{ display: 'flex', flexDirection: 'column', m: 1, p: 1 }}>
                <Typography>Параметры обработчика (нормальное распределение)</Typography>
                <Box display='flex'>
                  <FloatInput
                    label='Интенсивность (x2)'
                    errorText='Интенсивность может быть только положительным числом, отличным от нуля'
                    setVal={setSvcIntensityPoint}
                    valConverted={svcI2P(svcIntensityPoint)}
                    valHintText='M='
                    valid={valid}
                  />
                </Box>
                <Box display='flex'>
                  <FloatInput
                    label='σ (x3)'
                    errorText='σ может быть только положительным числом, отличным от нуля'
                    setVal={setSvcSigmaPoint}
                    valid={valid}
                  />
                </Box>
                <Button sx={{ mt: 1 }} variant='outlined' onClick={onPointCheck}>Проверить</Button>
              </Card>
            </Paper>}
        </Box>
        <Button disabled={!validAll()} sx={{ mb: 1 }} variant='contained' onClick={onRequestExperiment}>Провести эксперимент</Button>
        {fetchState == FetchState.LOADING && <CircularProgress />}
        {fetchResult && fetchState != FetchState.LOADING &&
          <Box>
            <Typography>Линейная регрессия:</Typography>
            <Typography>y = {fmt(fetchResult.b[0])} {fmt(fetchResult.b[1])}*x1 {fmt(fetchResult.b[2])}*x2 {fmt(fetchResult.b[3])}*x3
            </Typography>

            <Typography>Частично нелинейная:</Typography>
            <Typography>y = {fmt(fetchResult.b[0])} {fmt(fetchResult.b[1])}*x1 {fmt(fetchResult.b[2])}*x2 {fmt(fetchResult.b[3])}*x3 {fmt(fetchResult.b[4])}*x1*x2 {fmt(fetchResult.b[5])}*x1*x3 {fmt(fetchResult.b[6])}*x2*x3 {fmt(fetchResult.b[7])}*x1*x2*x3
            </Typography>
          </Box>}
        {experimentMatrix && fetchState != FetchState.LOADING && <ExperimentTable data={experimentMatrix} />}
      </Box>
    </ThemeProvider>
  );
}

export default App;
