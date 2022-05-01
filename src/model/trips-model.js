import {generatePointLocal, generateOffers} from '../mock/trip-mock';
import {MOCK_QUANTITY} from '../const';

export default class TripsModel {
  trips = Array.from({length: MOCK_QUANTITY}, generatePointLocal);
  offers = Array.from({length: MOCK_QUANTITY}, generateOffers);

  getTrips = () => this.trips;
  getOffers = () => this.offers;
}
