import FormEditView from '../view/form-edit-view';

import {
  remove,
  render,
  RenderPosition,
} from '../framework/render';

import {
  UpdateType,
  UserAction,
} from '../const';

export default class TripPointPresenter {
  #tripListContainer = null;
  #changeData = null;
  #formEditComponent = null;
  #destroyCallback = null;

  constructor(tripListContainer, changeData) {
    this.#tripListContainer = tripListContainer;
    this.#changeData = changeData;
  }

  init = (callback, offers, destinations) => {
    this.#destroyCallback = callback;

    if (this.#formEditComponent !== null) {
      return;
    }

    this.#formEditComponent = new FormEditView(null, offers, destinations);

    this.#formEditComponent.setFormSubmitHandler(this.#handleFormSubmit);
    this.#formEditComponent.setDeleteClickHandler(this.#handleDeleteClick);

    render(this.#formEditComponent, this.#tripListContainer, RenderPosition.AFTERBEGIN);

    document.addEventListener('keydown', this.#escKeyDownHandler);
  };

  destroy = () => {
    if (this.#formEditComponent === null) {
      return;
    }

    this.#destroyCallback?.();

    remove(this.#formEditComponent);
    this.#formEditComponent = null;

    document.removeEventListener('keydown', this.#escKeyDownHandler);
  };

  setSaving = () => {
    this.#formEditComponent.updateElement({
      isDisabled: true,
      isSaving: true,
    });
  };

  setAborting = () => {
    const resetFormState = () => {
      this.#formEditComponent.updateElement({
        isDisabled: false,
        isSaving: false,
        isDeleting: false,
      });
    };

    this.#formEditComponent.shake(resetFormState);
  };

  #handleFormSubmit = (trip) => {
    this.#changeData(
      UserAction.ADD_TRIP,
      UpdateType.MINOR,
      trip,
    );
  };

  #handleDeleteClick = () => {
    this.destroy();
  };

  #escKeyDownHandler = (evt) => {
    if (evt.key === 'Escape' || evt.key === 'Esc') {
      evt.preventDefault();
      this.destroy();
    }
  };
}
