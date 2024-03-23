import { Box, Button, Card, Paper, TextField, ThemeProvider, Typography } from '@mui/material';
import { LineChart } from '@mui/x-charts';
import React, { useState } from 'react';
import { ModelResult, startModel } from './model/Model';
import { theme } from './theme';

const grd = 10;
const step = 1;
const perPoint = 100;

function App() {
  const [model, setModel] = useState<ModelResult | null>(null);

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


  const xSvcI = Array(grd).fill(0).map((_, i) => 1 + (i + 1) * step);
  const xSvcG = grd * step;
  const xGenI = Array(grd).fill(0).map((_, i) => 1 + (i + 1) * step);
  const xGenG = step;
  const xCoefI = Array(grd).fill(0).map((_, i) => (i + 1) / grd);
  const xCoefI2 = Array(grd).fill(0).map((_, i) => (i + 1) / grd);

  const [ySvc, setYSvc] = useState<number[]>([]);
  const [yGen, setYGen] = useState<number[]>([]);
  const [yCoef, setYCoef] = useState<number[]>([]);
  const [yCoef2, setYCoef2] = useState<number[]>([]);

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
                <TextField label='Общее число заявок' variant='standard' aria-readonly value={model.requestsTotal} />
                <TextField label='Число обработанных заявок' variant='standard' aria-readonly value={model.requestsHandled} />
                <TextField label='Число небработанных заявок (размер очереди)' variant='standard' aria-readonly value={model.queueSize} />
                <TextField label='Среднее время ожидания в очереди' variant='standard' aria-readonly value={model.queueTimeAverage} />
                <TextField label='Загрузка ОА (практический)' variant='standard' aria-readonly value={model.busyTime / model.modelTime} />
                <TextField label='Загрузка ОА (теоретический)' variant='standard' aria-readonly value={sourceIntensity / serviceIntensity} />
              </Card>
            </Paper>}
        </Box>
        <Button
          disabled={!validAll()}
          variant='contained'
          sx={{ m: 'auto' }}
          onClick={() => {
            console.log('click!');
            setModel(startModel({ modelTime, serviceMean, serviceSigma, sourceSigma }));

            const ySvcRes = Array(xSvcI.length);
            for (let i = 0; i < xSvcI.length; i++) {
              let sum = 0;
              const params = { modelTime, serviceMean: svcIntensityToParam(xSvcI[i]), serviceSigma, sourceSigma: srcIntensityToParam(xGenG) };
              for (let j = 0; j < perPoint; j++)
                sum += startModel(params).queueTimeAverage;
              ySvcRes[i] = sum / perPoint;
              console.log('iteration 1');
            }
            console.log('finished 1');

            const yGenRes = Array(xGenI.length);
            for (let i = 0; i < xGenI.length; i++) {
              let sum = 0;
              const params = { modelTime, serviceMean: srcIntensityToParam(xSvcG), serviceSigma, sourceSigma: srcIntensityToParam(xGenI[i]) };
              for (let j = 0; j < perPoint; j++)
                sum += startModel(params).queueTimeAverage;
              yGenRes[i] = sum / perPoint;
              console.log('iteration 2');
            }
            console.log('finished 2');

            const yCoefRes = Array(xCoefI.length);
            for (let i = 0; i < xCoefI.length; i++) {
              let sum = 0;
              const svcMean = svcIntensityToParam(xSvcG);
              const srcSigma = srcIntensityToParam(xSvcG * xCoefI[i]);
              const params = { modelTime, serviceMean: svcMean, serviceSigma, sourceSigma: srcSigma };
              for (let j = 0; j < perPoint * 100; j++)
                sum += startModel(params).queueTimeAverage;
              yCoefRes[i] = sum / perPoint;
              console.log('iteration 3');
            }
            console.log('finished 3');

            // const yCoefRes2 = Array(xCoefI2.length);
            // for (let i = 0; i < xCoefI2.length; i++) {
            //   let sum = 0;
            //   const svcMean = svcIntensityToParam(xGenG * xCoefI2[i]);
            //   const srcSigma = srcIntensityToParam(xGenG);
            //   const params = { modelTime, serviceMean: svcMean, serviceSigma, sourceSigma: srcSigma };
            //   for (let j = 0; j < perPoint; j++)
            //     sum += startModel(params).queueTimeAverage;
            //   yCoefRes2[i] = sum / perPoint;
            //   console.log('iteration 4');
            // }
            // console.log('finished 4');

            setYSvc(ySvcRes);
            setYGen(yGenRes);
            setYCoef(yCoefRes);
            //setYCoef2(yCoefRes2);
          }}>
          Моделировать!
        </Button>
        <Box display='flex' flexDirection='column'>
          <LineChart
            sx={{ m: 'auto', mt: 4 }}
            xAxis={[{ data: xSvcI, label: 'Интенсивность ОА' }]}
            title='Зависимость среднего времени ожидания от интенсивности ОА'
            series={[
              {
                data: ySvc,
                label: `Среднее время ожидания (инт. ИЗ: ${xGenG})`
              },
            ]}
            width={1000}
            height={300}
          />
          <LineChart
            sx={{ m: 'auto', mt: 4 }}
            xAxis={[{ data: xGenI, label: 'Интенсивность ИЗ' }]}
            title='Зависимость среднего времени ожидания от интенсивности ИЗ'
            series={[
              {
                data: yGen,
                label: `Среднее время ожидания (инт. ОА: ${xSvcG})`
              },
            ]}
            width={1000}
            height={300}
          />
          <LineChart
            sx={{ m: 'auto', mt: 4 }}
            xAxis={[{ data: [0].concat(...xCoefI), label: 'Загрузка ОА' }]}
            title='Зависимость среднего времени ожидания от загрузки ОА'
            series={[
              {
                data: [0].concat(...yCoef),
                label: `Среднее время ожидания (инт. ИЗ: ${xGenG})`
              },
            ]}
            width={1000}
            height={300}
          />

          {/* <LineChart
            sx={{ m: 'auto', mt: 4 }}
            xAxis={[{ data: xCoefI2, label: 'Загрузка ОА' }]}
            title='Зависимость среднего времени ожидания от загрузки ОА'
            series={[
              {
                data: yCoef2,
                label: `Среднее время ожидания (инт. ОА: ${xSvcG})`
              },
            ]}
            width={1000}
            height={300}
          /> */}
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
