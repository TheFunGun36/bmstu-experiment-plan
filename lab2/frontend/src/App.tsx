import { Box, Button, Card, Paper, TextField, ThemeProvider, Typography } from '@mui/material';
import { LineChart } from '@mui/x-charts';
import React, { useState } from 'react';
import { ModelResult, startModel } from './model/Model';
import { theme } from './theme';
import { useModel } from './api/hooks';

const grd = 10;
const step = 1;
const perPoint = 100;

function App() {
  const [fetchModel, model, getModel] = useModel();
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

  //const svcParamToIntensity = (mean: number) => 1 / Math.exp(mean + serviceSigma * serviceSigma / 2);
  //const svcIntensityToParam = (i: number) => -Math.log(i) - serviceSigma * serviceSigma / 2;

  const svcParamToIntensity = (mean: number) => 1 / mean;
  const svcIntensityToParam = (i: number) => 1 / i;

  const actualMean = Math.log(serviceMean) - serviceSigma * serviceSigma / 2
  const actualSigma = Math.sqrt(
    Math.log(
      0.5 *
      Math.exp(-2 * serviceMean) *
      (
        Math.sqrt(
          4 * Math.exp(2 * serviceMean) * serviceSigma +
          Math.exp(4 * serviceMean)
        ) +
        Math.exp(2 * serviceMean)
      )
    )
  );

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
        <Button
          disabled={!validAll()}
          variant='contained'
          sx={{ m: 'auto' }}
          onClick={() => {
            getModel({ generator_sigma: sourceSigma, model_time: modelTime, service_mean: actualMean, service_sigma: actualSigma })
          }}>
          Моделировать!
        </Button>
      </Box>
    </ThemeProvider>
  );
}

export default App;
