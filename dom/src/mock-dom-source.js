import Rx from 'rx'

const emptyStream = Rx.Observable.empty()

function getEventsStreamForSelector(mockedEventTypes) {
  return function getEventsStream(eventType) {
    for (const key in mockedEventTypes) {
      if (mockedEventTypes.hasOwnProperty(key) && key === eventType) {
        return mockedEventTypes[key]
      }
    }
    return emptyStream
  }
}

function makeMockSelector(mockedSelectors) {
  return function select(selector) {
    for (const key in mockedSelectors) {
      if (mockedSelectors.hasOwnProperty(key) && key === selector) {
        let observable = emptyStream
        if (mockedSelectors[key].hasOwnProperty(`observable`)) {
          observable = mockedSelectors[key].observable
        }
        return {
          observable,
          select: makeMockSelector(mockedSelectors[key]),
          events: getEventsStreamForSelector(mockedSelectors[key]),
        }
      }
    }
    return {
      observable: emptyStream,
      select: makeMockSelector(mockedSelectors),
      events: () => emptyStream,
    }
  }
}

function mockDOMSource(mockedSelectors = {}) {
  return {
    observable: emptyStream,
    select: makeMockSelector(mockedSelectors),
    events: () => emptyStream,
  }
}

export default mockDOMSource
