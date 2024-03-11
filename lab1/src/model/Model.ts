import { Gaussian } from "ts-gaussian";
import { Rayleigh } from "./Rayleigh";

export interface ModelProps {
  modelTime: number;  // Общее время моделирования

  // Параметры генератора
  sourceSigma: number;

  // Параметры обслуживающего устройства
  serviceSigma: number;
  serviceMean: number;
}

export type ModelResult = {
  modelTime: number,
  requestsTotal: number,
  requestsHandled: number,
  queueSize: number,
  busyTime: number,
  queueTimeAverage: number,
};

type Generator = {
  type: "generator",
  distribution: () => number,
  lastEvent: number,
  requestsGenerated: number,
};

type ServiceUnit = {
  type: "service";
  distribution: () => number,
  lastEvent: number,
  requestsHandled: number,
  busyTime: number,
};

type Unit = Generator | ServiceUnit;

function minUnit(arr: Unit[]) {
  let best = arr[0];
  for (let i = 1; i < arr.length; i++) {
    if (arr[i].lastEvent < best.lastEvent)
      best = arr[i];
  }
  return best;
}

function maxUnit(arr: Unit[]) {
  let best = arr[0];
  for (let i = 1; i < arr.length; i++) {
    if (arr[i].lastEvent > best.lastEvent)
      best = arr[i];
  }
  return best;
}

function minGen(arr: Unit[]) {
  let best = arr.find((v) => v.type === 'generator')!;
  for (let i = 1; i < arr.length; i++) {
    if (arr[i].type === 'generator' && arr[i].lastEvent < best.lastEvent)
      best = arr[i];
  }
  return best;
}

export function startModel(p: ModelProps) {
  const res: ModelResult = {
    modelTime: p.modelTime,
    requestsTotal: 0,
    requestsHandled: 0,
    queueSize: -1,
    busyTime: 0,
    queueTimeAverage: 0,
  };

  // Закон поступления --- Рэлея
  const getGen = () => Math.sqrt(-2 * p.sourceSigma * p.sourceSigma * Math.log(1 - Math.random()));

  // Закон распределения времени обслуживания --- Нормальный
  const gaussian = new Gaussian(p.serviceMean, p.serviceSigma);
  const getSvc = () => gaussian.ppf(Math.random());

  let eventQueue: number[] = [];

  const units: Unit[] = [
    {
      type: 'generator',
      distribution: getGen,
      lastEvent: 0,
      requestsGenerated: 0
    },
    {
      type: 'service',
      distribution: getSvc,
      lastEvent: 0,
      requestsHandled: 0,
      busyTime: 0
    }
  ];

  let unit = minUnit(units);
  while (unit.lastEvent < p.modelTime) {
    if (unit.type === 'generator') {
      res.requestsTotal++;
      unit.requestsGenerated++;
      eventQueue.push(unit.lastEvent);
      unit.lastEvent += unit.distribution();
    }
    else {
      if (eventQueue.length > 0) {
        res.queueTimeAverage += unit.lastEvent - eventQueue.shift()!;
        res.requestsHandled++;
        unit.requestsHandled++;
        const t = unit.distribution();
        unit.lastEvent += t;
        unit.busyTime += t;
        res.busyTime += t;
      }
      else {
        const t = unit.distribution();
        const gen = minGen(units) as Generator;
        unit.lastEvent = gen.lastEvent + t;

        res.requestsTotal++;
        gen.requestsGenerated++;
        eventQueue.push(gen.lastEvent);
        gen.lastEvent += gen.distribution();
      }
    }
    
    unit = minUnit(units);
  }

  res.queueSize = eventQueue.length;
  res.queueTimeAverage /= res.requestsHandled;
  res.modelTime = maxUnit(units).lastEvent;

  //console.log(genTimeline);
  //console.log(svcTimeline);

  return res;
}
