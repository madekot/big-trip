import NoTripView from '../view/no-trip-view';
import SortingView from '../view/sorting-view';
import TripListView from '../view/trip-list-view';

import TripPointPresenter from './trip-point-presenter';
import TripNewPresenter from './trip-new-presenter';

import {render, remove} from '../framework/render';
import {SortType, UpdateType, UserAction, FilterType} from '../const';
import {filter} from '../utils/filter';

import {
  sortTripDay,
  sortTripPrice,
  sortTripTime,
} from '../utils/trips';

export default class TripPresenter {
  #boardContainer = null;

  #tripsModel = null;
  #filterModel = null;

  #sortingComponent = null;
  #tripListComponent = new TripListView();
  #noTripComponent = null;

  #tripPointPresenter = new Map();
  #tripNewPresenter = null;

  #currentSortType = SortType.DEFAULT;
  #filterType = FilterType.EVERYTHING;

  #dataOffers = [];
  #dataDestinations = [];

  constructor(boardContainer, tripsModel, filterModel) {
    this.#boardContainer = boardContainer;
    this.#tripNewPresenter = new TripNewPresenter(
      this.#tripListComponent.element, this.#handleViewAction);

    this.#tripsModel = tripsModel;
    this.#filterModel = filterModel;

    this.#tripsModel.addObserver(this.#handleModelEvent);
    this.#filterModel.addObserver(this.#handleModelEvent);
  }

  get trips() {
    this.#filterType = this.#filterModel.filter;
    const trips = this.#tripsModel.trips;
    const filteredTrips = filter[this.#filterType](trips);

    switch (this.#currentSortType) {
      case SortType.DAY:
        return filteredTrips.sort(sortTripDay);

      case SortType.PRICE:
        return filteredTrips.sort(sortTripPrice);

      case SortType.TIME:
        return filteredTrips.sort(sortTripTime);
    }

    return filteredTrips;
  }

  init = () => {
    this.#dataOffers = [...this.#tripsModel.offers];
    this.#dataDestinations = [...this.#tripsModel.destinations];

    this.#renderBoard();
  };

  createTrip = (callback) => {
    this.#currentSortType = SortType.DEFAULT;
    this.#filterModel.setFilter(UpdateType.MAJOR, FilterType.EVERYTHING);
    // console.log(this.#tripsModel.destinations)
    // console.log(this.#tripsModel.offers)
    this.#tripNewPresenter.init(callback, this.#tripsModel.offers, this.#tripsModel.destinations);
    // this.#tripNewPresenter.init(callback);
  };

  #renderTrip = (point, offers, destinations) => {
    const tripPointPresenter = new TripPointPresenter(
      this.#tripListComponent.element, this.#handleViewAction, this.#handleModeChange
    );
    // console.log(destinations)
    tripPointPresenter.init(point, offers, destinations);
    this.#tripPointPresenter.set(point.id, tripPointPresenter);
  };

  #handleModeChange = () => {
    this.#tripNewPresenter.destroy();
    this.#tripPointPresenter.forEach((presenter) => presenter.resetView());
  };

  #handleViewAction = (actionType, updateType, update) => {
    switch (actionType) {
      case UserAction.UPDATE_TRIP:
        this.#tripsModel.updateTrip(updateType, update);
        break;
      case UserAction.ADD_TRIP:
        this.#tripsModel.addTrip(updateType, update);
        break;
      case UserAction.DELETE_TRIP:
        this.#tripsModel.deleteTrip(updateType, update);
        break;
    }
  };

  #handleModelEvent = (updateType, data) => {
    switch (updateType) {
      case UpdateType.PATCH:
        this.#tripPointPresenter.get(data.id).init(data);
        break;
      case UpdateType.MINOR:
        this.#clearBoard();
        this.#renderBoard();
        break;
      case UpdateType.MAJOR:
        this.#clearBoard({resetSortType: true});
        this.#renderBoard();
        break;
    }
  };

  #handleSortTypeChange = (sortType) => {
    if (this.#currentSortType === sortType) {
      return;
    }

    this.#currentSortType = sortType;
    this.#clearBoard();
    this.#renderBoard();
  };

  #renderSort = () => {
    this.#sortingComponent = new SortingView(this.#currentSortType);
    this.#sortingComponent.setSortTypeChangeHandler(this.#handleSortTypeChange);

    render(this.#sortingComponent, this.#boardContainer);
  };

  #renderTrips = (trips) => {
    trips.forEach((trip) => this.#renderTrip(trip, this.#dataOffers, this.#dataDestinations));
  };

  #renderNoTrip = () => {
    this.#noTripComponent = new NoTripView(this.#filterType);
    render(this.#noTripComponent, this.#boardContainer);
  };

  #renderBoard = () => {
    if (!this.trips.length) {
      this.#renderNoTrip();
      return;
    }

    this.#renderSort();

    render(this.#tripListComponent, this.#boardContainer);
    this.#renderTrips(this.trips);
  };

  #clearBoard = ({resetSortType = false} = {}) => {
    this.#tripPointPresenter.forEach((presenter) => presenter.destroy());
    this.#tripPointPresenter.clear();

    remove(this.#sortingComponent);

    if (this.#noTripComponent) {
      remove(this.#noTripComponent);
    }

    if (resetSortType) {
      this.#currentSortType = SortType.DEFAULT;
    }
  };
}
