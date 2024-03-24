import { Box, Button, Card, CircularProgress, LinearProgress, Paper, TextField, ThemeProvider, Typography } from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';
import React, { useState } from 'react';
import { theme } from './theme';
import { FetchState, useGenSpread, useModel, useSvcSpread } from './api/hooks';

function App() {
  const [fetchModel, model, getModel] = useModel();
  const [fetchModelSvc, modelSvc, getModelSvc] = useSvcSpread();
  const [fetchModelLoad, modelLoad, getModelLoad] = useGenSpread();
  const [fetchModelGen, modelGen, getModelGen] = useGenSpread();
  //const [model, setModel] = useState<ModelResult | undefined>(undefined);

  const valid = (n: number) => !isNaN(n) && n >= 0 && n !== 0;
  const validAll = () => valid(modelTime) && valid(sourceSigma) && valid(serviceSigma) && valid(serviceMean);

  const [modelTime, setModelTime] = useState<number>(0);
  const [sourceSigma, setSourceSigma] = useState<number>(0);
  const [serviceSigma, setServiceSigma] = useState<number>(0);
  const [serviceMean, setServiceMean] = useState<number>(0);
  const [sourceIntensity, setSourceIntensity] = useState<number>(0);
  const [serviceIntensity, setServiceIntensity] = useState<number>(0);
  const [modelTimeStr, setModelTimeStr] = useState('');
  const [sourceSigmaStr, setSourceSigmaStr] = useState('');
  const [serviceSigmaStr, setServiceSigmaStr] = useState('');
  const [serviceMeanStr, setServiceMeanStr] = useState('');
  const [sourceIntensityStr, setSourceIntensityStr] = useState('');
  const [serviceIntensityStr, setServiceIntensityStr] = useState('');
  const [modelTimeErr, setModelTimeErr] = useState<boolean>(false);
  const [sourceSigmaErr, setSourceSigmaErr] = useState<boolean>(false);
  const [serviceSigmaErr, setServiceSigmaErr] = useState<boolean>(false);
  const [serviceMeanErr, setServiceMeanErr] = useState<boolean>(false);
  const [sourceIntensityErr, setSourceIntensityErr] = useState<boolean>(false);
  const [serviceIntensityErr, setServiceIntensityErr] = useState<boolean>(false);

  const srcParamToIntensity = (sigma: number) => 1 / (Math.sqrt(Math.PI / 2) * sigma);
  const srcIntensityToParam = (i: number) => 1 / (Math.sqrt(Math.PI / 2) * i);

  const svcParamToIntensity = (mean: number) => 1 / mean;
  const svcIntensityToParam = (i: number) => 1 / i;

  const actualMean = (m: number, s: number) => Math.log(m) - s * s / 2;
  const actualSigma = (m: number, s: number) => Math.sqrt(
    Math.log(
      0.5 *
      Math.exp(-2 * m) *
      (
        Math.sqrt(
          4 * Math.exp(2 * m) * s +
          Math.exp(4 * m)
        ) +
        Math.exp(2 * m)
      )
    )
  );

  const grid = 200;

  // По обработчику
  const svcPerPoint = 100;
  const svcModelTime = 4000;
  const svcSigma = 1;
  const svcIntensityBegin = 0.1;
  const svcIntensityEnd = 2;
  const svcStep = (svcIntensityEnd - svcIntensityBegin) / (grid - 1)
  const genIntensity = 0.1;
  const svcSpread = [...Array(grid).keys()]
    .map((_, i) => svcIntensityBegin + i * svcStep);

  // По генератору
  const genPerPoint = 100;
  const genModelTime = 4000;
  const genIntensityBegin = 0.1;
  const genIntensityEnd = 2;
  const svcIntensity = 2;
  const genStep = (genIntensityEnd - genIntensityBegin) / (grid - 1);
  const genSpread = [...Array(grid).keys()]
    .map((i) => genIntensityBegin + i * genStep);

  if (modelSvc && modelGen) {
    console.log(modelSvc.queue_time_spread);
    console.log(modelGen.queue_time_spread);
  }

  // По загрузке
  const loadPerPoint = 100;
  const loadModelTime = 4000;
  const loadBegin = 0.0001;
  const loadEnd = 1;
  const loadStep = (loadEnd - loadBegin) / (grid - 1)
  const loadSpread = [...Array(grid).keys()]
    .map((_, i) => loadBegin + i * loadStep);

  return (
    <ThemeProvider theme={theme}>
      <Box display='flex' flexDirection='column' alignItems='center'>
        <Typography variant='h3' align='center'>Лабораборная работа №1</Typography>
        <Box display='flex' flexDirection='row'>
          <Paper variant='outlined' sx={{ margin: 'auto', m: 1 }}>
            <Card elevation={6} variant='elevation' sx={{ display: 'flex', flexDirection: 'column', m: 1, p: 1 }}>
              <Typography>Параметры генератора (распределение Рэлея)</Typography>
              <Box>
                <TextField
                  label='Интенсивность'
                  variant='standard'
                  error={sourceIntensityErr}
                  helperText={sourceIntensityErr && 'Интенсивность может быть только положительным числом, отличным от нуля'}
                  value={sourceIntensityStr}
                  onChange={(ev: React.ChangeEvent<HTMLInputElement>) => {
                    setSourceIntensityStr(ev.target.value);
                    const n = Number(ev.target.value);
                    setSourceIntensityErr(!valid(n));
                    setSourceIntensity(n);

                    if (valid(n)) {
                      const inv = srcIntensityToParam(n);
                      setSourceSigma(inv);
                      setSourceSigmaStr(inv.toFixed(4));
                      setSourceSigmaErr(false);
                    }
                  }}
                />
                <TextField
                  label='σ'
                  variant='standard'
                  error={sourceSigmaErr}
                  helperText={sourceSigmaErr && 'σ может быть только положительным числом, отличным от нуля'}
                  value={sourceSigmaStr}
                  onChange={(ev: React.ChangeEvent<HTMLInputElement>) => {
                    setSourceSigmaStr(ev.target.value);
                    const n = Number(ev.target.value);
                    setSourceSigmaErr(!valid(n));
                    setSourceSigma(n);

                    if (valid(n)) {
                      const inv = srcParamToIntensity(n);
                      setSourceIntensity(inv);
                      setSourceIntensityStr(inv.toFixed(4));
                      setSourceIntensityErr(false);
                    }
                  }}
                />
              </Box>
            </Card>
            <Card elevation={6} variant='elevation' sx={{ display: 'flex', flexDirection: 'column', m: 1, p: 1 }}>
              <Typography>Параметры обработчика (нормальное распределение)</Typography>
              <Box display='flex'>
                <TextField
                  label='Интенсивность'
                  variant='standard'
                  error={serviceIntensityErr}
                  helperText={serviceIntensityErr && 'Интенсивность может быть только положительным числом, отличным от нуля'}
                  value={serviceIntensityStr}
                  onChange={(ev: React.ChangeEvent<HTMLInputElement>) => {
                    setServiceIntensityStr(ev.target.value);
                    const n = Number(ev.target.value);
                    setServiceIntensityErr(!valid(n));
                    setServiceIntensity(n);

                    if (valid(n)) {
                      const inv = svcParamToIntensity(n);
                      setServiceMean(inv);
                      setServiceMeanStr(inv.toFixed(4));
                      setServiceMeanErr(false);
                    }
                  }}
                />
                <TextField
                  label='Мат. ожидание'
                  variant='standard'
                  error={serviceMeanErr}
                  helperText={serviceMeanErr && 'Мат. ожидание может быть только положительным числом, отличным от нуля'}
                  value={serviceMeanStr}
                  onChange={(ev: React.ChangeEvent<HTMLInputElement>) => {
                    setServiceMeanStr(ev.target.value);
                    const n = Number(ev.target.value);
                    setServiceMeanErr(!valid(n));
                    setServiceMean(n);

                    if (valid(n)) {
                      const inv = svcIntensityToParam(n);
                      setServiceIntensity(inv);
                      setServiceIntensityStr(inv.toFixed(4));
                      setServiceIntensityErr(false);
                    }
                  }}
                />
              </Box>
              <Box display='flex'>
                <TextField
                  label='σ'
                  variant='standard'
                  error={serviceSigmaErr}
                  helperText={serviceSigmaErr && 'σ может быть только положительным числом, отличным от нуля'}
                  value={serviceSigmaStr}
                  onChange={(ev: React.ChangeEvent<HTMLInputElement>) => {
                    setServiceSigmaStr(ev.target.value);
                    const n = Number(ev.target.value);
                    setServiceSigmaErr(!valid(n));
                    setServiceSigma(n);
                  }}
                />
              </Box>
            </Card>
            <Card elevation={6} variant='elevation' sx={{ display: 'flex', flexDirection: 'column', m: 1, p: 1 }}>
              <Box display='flex'>
                <TextField
                  label='Время моделирования'
                  variant='standard'
                  error={modelTimeErr}
                  helperText={modelTimeErr && 'Временя моделирования может быть только положительное число, отличное от нуля'}
                  value={modelTimeStr}
                  onChange={(ev: React.ChangeEvent<HTMLInputElement>) => {
                    setModelTimeStr(ev.target.value);
                    const n = Number(ev.target.value);
                    setModelTimeErr(!valid(n));
                    setModelTime(n);
                  }}
                />
              </Box>
            </Card>
          </Paper>
          {model &&
            <Paper variant='outlined' sx={{ margin: 'auto', m: 1, width: "700px" }}>
              <Card elevation={6} variant='elevation' sx={{ display: 'flex', gap: 1, flexDirection: 'column', m: 1, p: 1 }}>
                <Typography></Typography>
                <TextField label='Общее число заявок' variant='standard' aria-readonly value={model.request_total} />
                <TextField label='Число обработанных заявок' variant='standard' aria-readonly value={model.requests_handled} />
                <TextField label='Число небработанных заявок (размер очереди)' variant='standard' aria-readonly value={model.requests_in_queue} />
                <TextField label='Среднее время ожидания в очереди' aria-readonly={true} variant='standard' value={model.queue_time_avg} />
                <TextField label='Загрузка ОА (практическая)' variant='standard' aria-readonly value={model.load_avg} />
                <TextField label='Загрузка ОА (теоретическая)' variant='standard' aria-readonly value={sourceIntensity / serviceIntensity} />
              </Card>
            </Paper>}
        </Box>
        <Box display='flex'>
          <Button
            disabled={!validAll()}
            variant='contained'
            sx={{ m: 'auto', mr: 1 }}
            onClick={() => {
              getModel({
                generator_sigma: sourceSigma,
                model_time: modelTime,
                service_mean: serviceMean,
                service_sigma: serviceSigma
              })
            }}>
            Моделировать
          </Button>
          <Button
            variant='contained'
            sx={{ m: 'auto' }}
            onClick={async () => {
              await getModelSvc({
                generator_sigma: srcIntensityToParam(genIntensity),
                iteration_per_point: svcPerPoint,
                model_time: svcModelTime,
                service_mean_spread: svcSpread.map((v) => svcIntensityToParam(v)),
                service_sigma: svcSigma
              });

              await getModelGen({
                generator_sigma_spread: genSpread.map((v) => srcIntensityToParam(v)),
                iteration_per_point: genPerPoint,
                model_time: genModelTime,
                service_mean: svcIntensityToParam(svcIntensity),
                service_sigma: svcSigma
              });

              await getModelLoad({
                generator_sigma_spread: loadSpread.map(v => srcIntensityToParam(v * svcIntensity)),
                iteration_per_point: loadPerPoint,
                model_time: loadModelTime,
                service_mean: svcIntensityToParam(svcIntensity),
                service_sigma: svcSigma
              });
            }}>
            Построить графики
          </Button>
        </Box>
        <Box display='flex' flexDirection='column'>
          {fetchModelSvc == FetchState.LOADING && <LinearProgress />}
          {fetchModelSvc == FetchState.SUCCESS && modelSvc && (
            <LineChart
              sx={{ m: 'auto', mt: 4 }}
              xAxis={[{ data: svcSpread, label: 'Интенсивность ОА' }]}
              title='Зависимость среднего времени ожидания от интенсивности ОА'
              series={[
                {
                  data: modelSvc.queue_time_spread,
                  label: `Среднее время ожидания (инт. ИЗ: ${genIntensity})`,
                  curve: 'linear',
                  showMark: false
                },
              ]}
              width={1000}
              height={300}
              grid={{ vertical: true, horizontal: true }}
            />)}
          {fetchModelGen == FetchState.LOADING && <LinearProgress />}
          {fetchModelGen == FetchState.SUCCESS && modelGen && (
            <LineChart
              sx={{ m: 'auto', mt: 4 }}
              xAxis={[{ data: genSpread, label: 'Интенсивность ИЗ' }]}
              title='Зависимость среднего времени ожидания от интенсивности ИЗ'
              series={[
                {
                  data: modelGen.queue_time_spread,
                  label: `Среднее время ожидания (инт. ОА: ${svcIntensity})`,
                  curve: 'linear',
                  showMark: false
                },
              ]}
              width={1000}
              height={300}
              grid={{ vertical: true, horizontal: true }}
            />)}
          {fetchModelLoad == FetchState.LOADING && <LinearProgress />}
          {fetchModelLoad == FetchState.SUCCESS && modelLoad && (
            <LineChart
              sx={{ m: 'auto', mt: 4 }}
              xAxis={[{ data: loadSpread, label: 'Загрузка ОА' }]}
              title='Зависимость среднего времени ожидания от загрузки ОА'
              series={[
                {
                  data: modelLoad.queue_time_spread,
                  label: `Среднее время ожидания (инт. ИЗ: ${genIntensity})`,
                  curve: 'linear',
                  showMark: false
                },
              ]}
              width={1000}
              height={300}
              grid={{ vertical: true, horizontal: true }}
            />)}
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
