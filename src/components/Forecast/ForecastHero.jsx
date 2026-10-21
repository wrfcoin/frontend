import React from 'react';
import WeatherIcon from './WeatherIcon';
import { currentIsEmpty, observedLabel } from './forecastModel';

const dash = '—';

/**
 * Current-conditions hero. Everything in it is a reported field: temperature, humidity, wind and
 * pressure come from the current observation; the condition text and rain chance come from the
 * first hourly forecast period and are labelled as forecast. Null fields print "—"; an observation
 * with no reportable value at all renders the empty variant.
 */
export default function ForecastHero({ current, nextHour, cell }) {
  if (currentIsEmpty(current)) {
    return (
      <section className="pf-hero pf-hero--empty" aria-label="Current conditions">
        <h2 className="pf-sr">Current conditions</h2>
        <div className="pf-hero__main">
          <div className="pf-hero__icon pf-hero__icon--dim"><WeatherIcon name="fog" size={48} /></div>
          <div>
            <p className="pf-hero__cond">No current observation for this cell</p>
            <p className="pf-hero__sub">
              NOAA has no station report for {cell} right now. The hourly and 7-day forecasts below are still available.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const icon = nextHour?.icon ?? null;
  const observed = observedLabel(current.observedAt);
  const stats = [
    { key: 'humidity', label: 'Humidity', icon: 'drop', value: current.humidityPercent === null ? dash : `${current.humidityPercent}%` },
    { key: 'wind', label: 'Wind', icon: 'wind', value: current.windMph === null ? dash : `${current.windMph} mph` },
    { key: 'pressure', label: 'Pressure', icon: 'gauge', value: current.pressureHpa === null ? dash : `${current.pressureHpa} hPa` },
    {
      key: 'rain',
      label: 'Rain chance',
      icon: 'rain',
      value: nextHour?.precipitation === null || nextHour?.precipitation === undefined ? dash : `${nextHour.precipitation}%`,
      note: 'forecast, next hour',
    },
  ];

  return (
    <section className="pf-hero" aria-label="Current conditions">
      <h2 className="pf-sr">Current conditions</h2>
      <div className="pf-hero__main">
        <div className="pf-hero__icon">{icon ? <WeatherIcon name={icon} size={56} /> : <WeatherIcon name="cloud" size={56} />}</div>
        <div>
          <p className="pf-hero__temp">
            {current.temperatureF === null ? dash : current.temperatureF}
            <span className="pf-hero__unit">°F</span>
          </p>
          <p className="pf-hero__cond">
            {current.conditions ?? nextHour?.shortForecast ?? 'Conditions not reported'}
            {!current.conditions && nextHour?.shortForecast ? <span className="pf-hero__tag">forecast, next hour</span> : null}
          </p>
          <p className="pf-hero__sub">{observed ? `Observed ${observed}` : 'Observation time not reported'}</p>
        </div>
      </div>
      <dl className="pf-hero__stats">
        {stats.map(s => (
          <div key={s.key}>
            <dt><WeatherIcon name={s.icon} size={14} />{s.label}</dt>
            <dd>{s.value}{s.note && s.value !== dash ? <span className="pf-hero__tag">{s.note}</span> : null}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
