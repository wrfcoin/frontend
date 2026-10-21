import React from 'react';
import WeatherIcon from './WeatherIcon';

/** One 7-day card: a NOAA daytime period paired with its night (see forecastModel.pairDailyPeriods). */
export default function ForecastDayCard({ card }) {
  const deg = value => (value === null ? '—' : `${value}°`);
  return (
    <li className="pf-day">
      <div className="pf-day__when">
        <div className="pf-day__name">{card.day}</div>
        <div className="pf-day__date">{card.date}</div>
      </div>
      <div className="pf-day__icon">{card.icon ? <WeatherIcon name={card.icon} size={40} /> : null}</div>
      <div className="pf-day__text">
        <div className="pf-day__short">{card.dayText ?? (card.nightText ? '' : 'No forecast text')}</div>
        {card.nightText ? (
          <div className="pf-day__night"><WeatherIcon name="moon" size={14} />{card.nightText}</div>
        ) : null}
      </div>
      <div className="pf-day__temps">
        <span className="pf-day__hi">{deg(card.high)}</span>
        <span className="pf-day__lo"> / {deg(card.low)}</span>
      </div>
      {card.precipitation !== null && card.precipitation > 0 ? (
        <div className="pf-day__pop"><WeatherIcon name="drop" size={12} />{card.precipitation}%</div>
      ) : null}
    </li>
  );
}
