/* global require */
const test = require(`tape`)
const Rx = require(`rx`)
const {
  makeHistoryDriver,
  makeServerHistoryDriver,
} = require(`../src/index`)

const statelessUrl$ = Rx.Observable.from([
  `/home`,
  `/home/profile`,
  `/`,
  `/about`,
])

const statefulUrl$ = Rx.Observable.from([
  {state: {y: 400}, path: `/home`},
  {state: {y: 350}, path: `/home/profile`},
  {state: {y: 0}, path: `/`},
  {state: {y: 1000}, path: `/about?x=99`},
])

const mixedStateUrl$ = Rx.Observable.from([
  `/home`,
  `/home/profile`,
  {state: {y: 0}, path: `/`},
  `/about`,
])

test(`makeHistoryDriver`, t => {
  t.equals(typeof makeHistoryDriver({}), `function`, `should return a function`)
  t.ok(makeHistoryDriver(), `should be accept no parameter`)
  t.ok(makeHistoryDriver({
    hash: true,
    queries: true,
    basename: `home`,
  }), `should accept an options object`)
  t.ok(makeHistoryDriver(`hello`), `should ignore a string`)
  t.ok(makeHistoryDriver([`hello`]), `should ignore an array`)
  t.ok(makeHistoryDriver(true), `should ignore a boolean`)
  t.end()
})

test(`historyDriver`, t => {
  const historyDriver = makeHistoryDriver()

  t.ok(historyDriver(statelessUrl$), `should accept an observable`)
  t.ok(historyDriver(statelessUrl$),
    `should accept an observable of stateless paths`)
  t.ok(historyDriver(statefulUrl$), `should accept observable of state objects`)
  t.ok(historyDriver(mixedStateUrl$),
    `should accept observable with a mix of stateless and stateful`)
  t.ok(historyDriver(mixedStateUrl$) instanceof Rx.BehaviorSubject,
    `should return an Rx.BehaviorSubject`)
  t.end()
})

test(`historySubject`, t => {
  const historySubject = makeHistoryDriver({
    hash: false,
    queries: true,
    basename: `/home`,
  })(statefulUrl$)

  historySubject
    .subscribe(location => {
      t.equals(typeof location, `object`, `should return a location object`)
      t.equals(location.pathname, `/about`, `pathname should be /about`)
      t.equals(location.search, `?x=99`, `search should be ?x=99`)
      t.equals(typeof location.query, `object`, `queries should be an object`)
      t.equals(location.query.x, `99`, `queries.x should be 99`)
      t.equals(typeof location.state, `object`, `state should be an object`)
      t.equals(location.state.y, 1000, `state.y should be 1000`)
      t.equals(location.action, `PUSH`, `actions should be 'PUSH'`)
      t.equals(typeof location.key, `string`, `key should be a string`)
    })
  t.end()
})

const serverConfig = {
  pathname: `/about`,
  query: {x: `99`},
  search: `?x=99`,
  state: {y: 1000},
  action: `PUSH`,
  key: ``,
}

test(`makeServerHistoryDriver`, t => {
  t.equals(typeof makeServerHistoryDriver(serverConfig),
    `function`,
    `should return a function`)
  t.ok(makeServerHistoryDriver(serverConfig), `should accept a location object`)
  t.ok(makeServerHistoryDriver(),`should return defaults`)
  t.end()
})

test(`serverHistorySubject`, t => {
  const serverHistorySubject = makeServerHistoryDriver(serverConfig)()
  t.ok(serverHistorySubject instanceof Rx.BehaviorSubject,
    `should be an instance of Rx.BehaviorSubject`)
  serverHistorySubject.subscribe(location => {
    t.equals(typeof location, `object`, `should return a location object`)
    t.equals(location.pathname, `/about`, `pathname should be /about`)
    t.equals(location.search, `?x=99`, `search should be ?x=99`)
    t.equals(typeof location.query, `object`, `queries should be an object`)
    t.equals(location.query.x, `99`, `queries.x should be 99`)
    t.equals(typeof location.state, `object`, `state should be an object`)
    t.equals(location.state.y, 1000, `state.y should be 1000`)
    t.equals(location.action, `PUSH`, `actions should be 'PUSH'`)
    t.equals(typeof location.key, `string`, `key should be a string`)
  })
  t.end()
})
