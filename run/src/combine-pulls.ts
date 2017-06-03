import xs, {Stream} from 'xstream';
import {Pullable, PullableValue} from './pullable';

export interface CombineValues {
  <S, PV1>(s$: Stream<S>,
    p1: PullableValue<PV1>): Stream<[S, PV1]>;
  <S, PV1, PV2>(s$: Stream<S>,
    p1:PullableValue<PV1>, p2:PullableValue<PV2>): Stream<[S, PV1, PV2]>;
  <S, PV1, PV2, PV3>(s$: Stream<S>,
    p1:PullableValue<PV1>, p2:PullableValue<PV2>, p3:PullableValue<PV3>):
    Stream<[S, PV1, PV2, PV3]>;
  <S, PV1, PV2, PV3, PV4>(s$: Stream<S>,
    p1:PullableValue<PV1>, p2:PullableValue<PV2>, p3:PullableValue<PV3>,
    p4:PullableValue<PV4>):
    Stream<[S, PV1, PV2, PV3, PV4]>;
  <S, PV1, PV2, PV3, PV4, PV5>(s$: Stream<S>,
    p1:PullableValue<PV1>, p2:PullableValue<PV2>, p3:PullableValue<PV3>,
    p4:PullableValue<PV4>, p5:PullableValue<PV5>):
    Stream<[S, PV1, PV2, PV3, PV4, PV5]>;
  <S, PV1, PV2, PV3, PV4, PV5, PV6>(s$: Stream<S>,
    p1:PullableValue<PV1>, p2:PullableValue<PV2>, p3:PullableValue<PV3>,
    p4:PullableValue<PV4>, p5:PullableValue<PV5>, p6:PullableValue<PV6>):
    Stream<[S, PV1, PV2, PV3, PV4, PV5, PV6]>;
  <S, PV1, PV2, PV3, PV4, PV5, PV6, PV7>(s$: Stream<S>,
    p1:PullableValue<PV1>, p2:PullableValue<PV2>, p3:PullableValue<PV3>,
    p4:PullableValue<PV4>, p5:PullableValue<PV5>, p6:PullableValue<PV6>,
    p7:PullableValue<PV7>):
    Stream<[S, PV1, PV2, PV3, PV4, PV5, PV6, PV7]>;
  <S, PV1, PV2, PV3, PV4, PV5, PV6, PV7, PV8>(s$: Stream<S>,
    p1:PullableValue<PV1>, p2:PullableValue<PV2>, p3:PullableValue<PV3>,
    p4:PullableValue<PV4>, p5:PullableValue<PV5>, p6:PullableValue<PV6>,
    p7:PullableValue<PV7>, p8:PullableValue<PV8>):
    Stream<[S, PV1, PV2, PV3, PV4, PV5, PV6, PV7, PV8]>;
  <S, PV1, PV2, PV3, PV4, PV5, PV6, PV7, PV8, PV9>(s$: Stream<S>,
    p1:PullableValue<PV1>, p2:PullableValue<PV2>, p3:PullableValue<PV3>,
    p4:PullableValue<PV4>, p5:PullableValue<PV5>, p6:PullableValue<PV6>,
    p7:PullableValue<PV7>, p8:PullableValue<PV8>, p9:PullableValue<PV9>):
    Stream<[S, PV1, PV2, PV3, PV4, PV5, PV6, PV7, PV8, PV9]>;
  <S, PV1, PV2, PV3, PV4, PV5, PV6, PV7, PV8, PV9, PV10>(s$: Stream<S>,
    p1:PullableValue<PV1>, p2:PullableValue<PV2>, p3:PullableValue<PV3>,
    p4:PullableValue<PV4>, p5:PullableValue<PV5>, p6:PullableValue<PV6>,
    p7:PullableValue<PV7>, p8:PullableValue<PV8>, p9:PullableValue<PV9>,
    p10:PullableValue<PV10>):
    Stream<[S, PV1, PV2, PV3, PV4, PV5, PV6, PV7, PV8, PV9, PV10]>;
}

/**
 * This function turns stream, given as a first argument, into new stream,
 * combined with data, pulled from given PullableValue's.
 * When original stream's event arives, it triggers pulls from given Pullables.
 * All resulting promises are turned into streams and are combined. Combined
 * stream is, as usual for xstreams, returns an array of datums. First element
 * in this array will contain event that originally triggered pulls.
 * @param {Stream} s$ a stream, which events trigger pulling action
 * @param {PullableValue} pN are PullableValue's
 * @return {Stream} is a stream of combined into array values from pulls, with
 * first element being event that triggered pulling actions.
 * @function combineValues
 */
export const combineValues: CombineValues = (function(
                      s$: Stream<any>,
                      ...pvs: PullableValue<any>[]): Stream<any[]> {
  return s$.map(s => {
    const streams = pvs
      .map(pv => pv.pull())
      .map(promise => xs.fromPromise(promise));
    return xs.combine(xs.of(s), ...streams);
  }).flatten();
}) as any;

export type F<T, U> = (t: T) => U;
export type PullAndPrep<S, TRequest, TReply> =
  [ Pullable<TRequest, TReply>, (s: S) => TRequest ];

// XXX extend signature to more entries

export interface CombinePulls {
  <S, Arg1, P1>(s$:Stream<S>,
    p1:Pullable<Arg1, P1>, arg1:F<S,Arg1>|null):
    Stream<[S, P1]>;
  <S, Arg1, P1, Arg2, P2>(s$:Stream<S>,
    p1:Pullable<Arg1, P1>, arg1:F<S,Arg1>|null,
    p2:Pullable<Arg2, P2>, arg2:F<S,Arg2>|null):
    Stream<[S, P1, P2]>;
  <S, Arg1, P1, Arg2, P2, Arg3, P3>(s$:Stream<S>,
    p1:Pullable<Arg1, P1>, arg1:F<S,Arg1>|null,
    p2:Pullable<Arg2, P2>, arg2:F<S,Arg2>|null,
    p3:Pullable<Arg3, P3>, arg3:F<S,Arg3>|null):
    Stream<[S, P1, P2, P3]>;
  <S, Arg1, P1, Arg2, P2, Arg3, P3, Arg4, P4>(s$:Stream<S>,
    p1:Pullable<Arg1, P1>, arg1:F<S,Arg1>|null,
    p2:Pullable<Arg2, P2>, arg2:F<S,Arg2>|null,
    p3:Pullable<Arg3, P3>, arg3:F<S,Arg3>|null,
    p4:Pullable<Arg4, P4>, arg4:F<S,Arg4>|null):
    Stream<[S, P1, P2, P3, P4]>;
  <S, Arg1, P1, Arg2, P2, Arg3, P3, Arg4, P4, Arg5, P5>(s$:Stream<S>,
    p1:Pullable<Arg1, P1>, arg1:F<S,Arg1>|null,
    p2:Pullable<Arg2, P2>, arg2:F<S,Arg2>|null,
    p3:Pullable<Arg3, P3>, arg3:F<S,Arg3>|null,
    p4:Pullable<Arg4, P4>, arg4:F<S,Arg4>|null,
    p5:Pullable<Arg5, P5>, arg5:F<S,Arg5>|null):
    Stream<[S, P1, P2, P3, P4, P5]>;
  <S, Arg1, P1, Arg2, P2, Arg3, P3, Arg4, P4, Arg5, P5, Arg6, P6>(s$:Stream<S>,
    p1:Pullable<Arg1, P1>, arg1:F<S,Arg1>|null,
    p2:Pullable<Arg2, P2>, arg2:F<S,Arg2>|null,
    p3:Pullable<Arg3, P3>, arg3:F<S,Arg3>|null,
    p4:Pullable<Arg4, P4>, arg4:F<S,Arg4>|null,
    p5:Pullable<Arg5, P5>, arg5:F<S,Arg5>|null,
    p6:Pullable<Arg6, P6>, arg6:F<S,Arg6>|null):
    Stream<[S, P1, P2, P3, P4, P5, P6]>;
  <S, Arg1, P1, Arg2, P2, Arg3, P3, Arg4, P4, Arg5, P5, Arg6, P6, Arg7, P7>(s$:Stream<S>,
    p1:Pullable<Arg1, P1>, arg1:F<S,Arg1>|null,
    p2:Pullable<Arg2, P2>, arg2:F<S,Arg2>|null,
    p3:Pullable<Arg3, P3>, arg3:F<S,Arg3>|null,
    p4:Pullable<Arg4, P4>, arg4:F<S,Arg4>|null,
    p5:Pullable<Arg5, P5>, arg5:F<S,Arg5>|null,
    p6:Pullable<Arg6, P6>, arg6:F<S,Arg6>|null,
    p7:Pullable<Arg7, P7>, arg7:F<S,Arg7>|null):
    Stream<[S, P1, P2, P3, P4, P5, P6, P7]>;
  <S, Arg1, P1, Arg2, P2, Arg3, P3, Arg4, P4, Arg5, P5, Arg6, P6, Arg7, P7>(s$:Stream<S>,
    p1:Pullable<Arg1, P1>, arg1:F<S,Arg1>|null,
    p2:Pullable<Arg2, P2>, arg2:F<S,Arg2>|null,
    p3:Pullable<Arg3, P3>, arg3:F<S,Arg3>|null,
    p4:Pullable<Arg4, P4>, arg4:F<S,Arg4>|null,
    p5:Pullable<Arg5, P5>, arg5:F<S,Arg5>|null,
    p6:Pullable<Arg6, P6>, arg6:F<S,Arg6>|null,
    p7:Pullable<Arg7, P7>, arg7:F<S,Arg7>|null):
    Stream<[S, P1, P2, P3, P4, P5, P6, P7]>;
  <S, Arg1, P1, Arg2, P2, Arg3, P3, Arg4, P4, Arg5, P5, Arg6, P6, Arg7, P7, Arg8, P8>(s$:Stream<S>,
    p1:Pullable<Arg1, P1>, arg1:F<S,Arg1>|null,
    p2:Pullable<Arg2, P2>, arg2:F<S,Arg2>|null,
    p3:Pullable<Arg3, P3>, arg3:F<S,Arg3>|null,
    p4:Pullable<Arg4, P4>, arg4:F<S,Arg4>|null,
    p5:Pullable<Arg5, P5>, arg5:F<S,Arg5>|null,
    p6:Pullable<Arg6, P6>, arg6:F<S,Arg6>|null,
    p7:Pullable<Arg7, P7>, arg7:F<S,Arg7>|null,
    p8:Pullable<Arg8, P8>, arg8:F<S,Arg8>|null):
    Stream<[S, P1, P2, P3, P4, P5, P6, P7, P8]>;
  <S, Arg1, P1, Arg2, P2, Arg3, P3, Arg4, P4, Arg5, P5, Arg6, P6, Arg7, P7, Arg8, P8, Arg9, P9>(s$:Stream<S>,
    p1:Pullable<Arg1, P1>, arg1:F<S,Arg1>|null,
    p2:Pullable<Arg2, P2>, arg2:F<S,Arg2>|null,
    p3:Pullable<Arg3, P3>, arg3:F<S,Arg3>|null,
    p4:Pullable<Arg4, P4>, arg4:F<S,Arg4>|null,
    p5:Pullable<Arg5, P5>, arg5:F<S,Arg5>|null,
    p6:Pullable<Arg6, P6>, arg6:F<S,Arg6>|null,
    p7:Pullable<Arg7, P7>, arg7:F<S,Arg7>|null,
    p8:Pullable<Arg8, P8>, arg8:F<S,Arg8>|null,
    p9:Pullable<Arg9, P9>, arg9:F<S,Arg9>|null):
    Stream<[S, P1, P2, P3, P4, P5, P6, P7, P8, P9]>;
  <S, Arg1, P1, Arg2, P2, Arg3, P3, Arg4, P4, Arg5, P5, Arg6, P6, Arg7, P7, Arg8, P8, Arg9, P9, Arg10, P10>(s$:Stream<S>,
    p1:Pullable<Arg1, P1>, arg1:F<S,Arg1>|null,
    p2:Pullable<Arg2, P2>, arg2:F<S,Arg2>|null,
    p3:Pullable<Arg3, P3>, arg3:F<S,Arg3>|null,
    p4:Pullable<Arg4, P4>, arg4:F<S,Arg4>|null,
    p5:Pullable<Arg5, P5>, arg5:F<S,Arg5>|null,
    p6:Pullable<Arg6, P6>, arg6:F<S,Arg6>|null,
    p7:Pullable<Arg7, P7>, arg7:F<S,Arg7>|null,
    p8:Pullable<Arg8, P8>, arg8:F<S,Arg8>|null,
    p9:Pullable<Arg9, P9>, arg9:F<S,Arg9>|null,
    p10:Pullable<Arg10, P10>, arg10:F<S,Arg10>|null):
    Stream<[S, P1, P2, P3, P4, P5, P6, P7, P8, P9, P10]>;
}

/**
 * This function turns stream, given as a first argument, into new stream,
 * combined with data, pulled from given Pullable's or PullableValue's (which,
 * by the way, extend Pullable interface).
 * When original stream's event arives, it triggers pulls from given Pullables.
 * All resulting promises are turned into streams and are combined. Combined
 * stream is, as usual for xstreams, returns an array of datums. First element
 * in this array will contain event that originally triggered pulls.
 * @param {Stream} s$ a stream, which events trigger pulling action
 * @param {Pullable} pN is either a Pullable or a Pullable value. Pullable
 * requires that it be followed in arguments list by function that creates pull
 * request argument. PullableValue, not needing argument for request pull,
 * should be followed by either null, so as to have one space in arguments list
 * between Pullable's.
 * @param {F} argN is either a function that takes stream event and returns an
 * argument for pull request, or null, if preceding is PullableValue that
 * doesn't need pull request argument.
 * @return {Stream} is a stream of combined into array values from pulls, with
 * first element being event that triggered pulling actions.
 * @function combinePulls
 */
export const combinePulls: CombinePulls = (function(
                      s$: Stream<any>,
                      ...pullAndArgFns: (Pullable<any, any>|F<any, any>)[]) {
  if ((pullAndArgFns.length % 2) !== 0) { throw new Error(
    "Uneven number of arguments: each pullable must have respective function, or an undefined, for pullable value, but an argument must be present"); }
  return s$.map(s => {
    const promises: Promise<any>[] = [];
    for (let i=0; i<pullAndArgFns.length; i+=1) {
      const p = pullAndArgFns[i] as Pullable<any, any>;
      const argFn = pullAndArgFns[i+1] as F<any, any>;
      promises.push(argFn ?
        p.pull(argFn(s)) :
        (p as PullableValue<any>).pull());
    }
    const streams = promises
      .map(promise => xs.fromPromise(promise));
    return xs.combine(xs.of(s), ...streams);
  }).flatten();
}) as any;
