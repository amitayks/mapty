'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const workField = document.querySelector('.workout');

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);

  constructor(cords, distance, duration) {
    this.cords = cords;
    this.distance = distance;
    this.duration = duration;
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type.slice(0, 1).toUpperCase()}${this.type.slice(
      1
    )} ${months[this.date.getMonth()]} ${this.date.getDate()}`;
  }
}

class Running extends Workout {
  type = 'running';
  constructor(cords, distance, duration, cadence) {
    super(cords, distance, duration);
    this.cadence = cadence;
    this._calcPace();
    this._setDescription();
  }

  _calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(cords, distance, duration, elevation) {
    super(cords, distance, duration);
    this.elevation = elevation;
    this._calcSpeed();
    this._setDescription();
  }

  _calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

// const run1 = new Running([34, -23], 15, 23, 30);
// const cycling1 = new Cycling([34, -22], 10, 22, 4);
// console.log(run1);
// console.log(cycling1);

class App {
  #workout = [];
  #map;
  #mapEvent;
  #zooLevel = 13;
  #marker;
  constructor() {
    this._getPosition();
    this._getLocalStorage();
    inputType.addEventListener('change', this._toggleField);
    form.addEventListener('submit', this._newWorkout.bind(this));
    containerWorkouts.addEventListener('click', this._getInfoView.bind(this));
  }
  //-----------------------//

  // getting the position from the user//
  _getPosition() {
    navigator.geolocation.getCurrentPosition(
      // pass it to the function _loadMap //
      this._loadMap.bind(this),
      function () {
        // if didn't get the location //
        alert('didn`t get your location');
      }
    );
  }
  //-----------------------//

  // loading the map into the ui //
  _loadMap(position) {
    const { longitude } = position.coords;
    const { latitude } = position.coords;
    const cords = [latitude, longitude];

    this.#map = L.map('map').setView(cords, this.#zooLevel);

    // costume the map look //
    L.tileLayer('https://tile.openstreetmap.fr/hot//{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // showing the form field after clicking on the map //
    this.#map.on('click', this._showForm.bind(this));

    this.#workout.forEach(work => this._submit(work));
  }
  //-----------------------//

  // getting the cords on the map after the click // mapE
  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
    // this._clearField();
  }
  //-----------------------//

  // trigger for switching the running / cycling option //
  _toggleField() {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }
  //-----------------------//

  // clearing the fields //
  _clearField() {
    inputCadence.value =
      inputDistance.value =
      inputDuration.value =
      inputElevation.value =
        '';
    inputDistance.focus();
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }
  //-----------------------//

  // creating new workout object //
  _newWorkout(e) {
    e.preventDefault();
    let workout;
    const { lat, lng } = this.#mapEvent.latlng;
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;

    // checking if the info valid -
    const check = (...input) => input.every(int => Number.isFinite(int));
    const check2 = (...input) => input.every(int => int > 0);

    // checking for the right type -
    if (type === 'running') {
      const cadence = +inputCadence.value;
      if (
        !check(distance, duration, cadence) ||
        !check2(distance, duration, cadence)
      )
        return alert('input not correct');
      // creating the new object -
      workout = new Running([lat, lng], distance, duration, cadence);
    }

    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      if (!check(distance, duration, elevation) || !check2(distance, duration))
        return alert('input not correct');

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }
    // pushing the new object to the workout array -
    this.#workout.push(workout);
    // creating the anchor on the map -
    this._submit(workout);
    // creating the info box -
    this._createLog(workout);
    // setting the local Storage -
    this._setLocalStorage();
  }
  //-----------------------//

  // decide what happened after the submit of the form //
  _submit(e) {
    const title = `${e.type === 'running' ? '🏃' : '🚴'} ${e.description}`;

    L.marker(e.cords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          autoClose: false,
          // closeButton: false,
          closeOnClick: false,
          className: `${e.type}-popup`,
          maxWidth: 250,
          minWidth: 100,
        })
      )
      .setPopupContent(title)
      .openPopup();
    this._clearField();
  }
  //-----------------------//

  // creating the log bar containing the workout info //
  _createLog(e) {
    const html = `
        <li class="workout workout--${e.type}" data-id="${e.id}">
        <div class="close-btn">x</div>
          <h2 class="workout__title">${e.description}</h2>
          <div class="workout__details">
            // <span class="workout__icon">${
              e.type === 'running' ? '🏃' : '🚴'
            }</span>
            <span class="workout__value">${e.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${e.duration}</span>
            <span class="workout__unit">min</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${
              e.type === 'running' ? e.pace : e.speed
            }</span>
            <span class="workout__unit">${
              e.type === 'running' ? 'min/km' : 'km/h'
            }</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">${
              e.type === 'running' ? '🦶🏼' : '⛰'
            }</span>
            <span class="workout__value">${
              e.type === 'running' ? e.cadence : e.elevation
            }</span>
            <span class="workout__unit">${
              e.type === 'running' ? 'spm' : 'm'
            }</span>
          </div>
        </li>`;
    form.insertAdjacentHTML('afterend', html);
    containerWorkouts.insert;
  }

  _getInfoView(e) {
    const el = e.target.closest('.workout');

    if (!el) return;

    const work = this.#workout.find(work => work.id === el.dataset.id);
    this.#map.setView(work.cords, this.#zooLevel, {
      Animation: true,
    });
  }
  //-----------------------//

  _setLocalStorage() {
    localStorage.setItem('workout', JSON.stringify(this.#workout));
  }

  _getLocalStorage() {
    const work = JSON.parse(localStorage.getItem('workout'));

    if (!work) return;

    this.#workout = work;

    this.#workout.forEach(work => this._createLog(work));
  }
}

const app = new App();

const closeWorkout = function (e) {
  console.log('hi');
};
