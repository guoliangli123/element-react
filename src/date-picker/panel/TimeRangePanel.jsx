import React from 'react';

import { PropTypes, Component } from '../../../libs';
import { limitRange, parseDate } from '../utils'
import TimeSpinner from '../basic/TimeSpinner'
import { PopperReactMixin } from '../../../libs/utils'
import Locale from '../../locale'

const MIN_TIME = parseDate('00:00:00', 'HH:mm:ss');
const MAX_TIME = parseDate('23:59:59', 'HH:mm:ss');

const isDisabled = function (minTime, maxTime) {
  const minValue = minTime.getHours() * 3600 + minTime.getMinutes() * 60 + minTime.getSeconds();
  const maxValue = maxTime.getHours() * 3600 + maxTime.getMinutes() * 60 + maxTime.getSeconds();

  return minValue > maxValue;
};

const calcTime = function (time) {
  time = Array.isArray(time) ? time : [time];
  const minTime = time[0] || new Date();
  const date = new Date();
  date.setHours(date.getHours() + 1);
  const maxTime = time[1] || date;

  if (minTime > maxTime) return calcTime();
  return { minTime, maxTime };
};

const mapPropsToState = (props) => {
  const {currentDates, format} = props
  const {minTime, maxTime} = calcTime(currentDates)

  const state = {
    format: format || 'HH:mm:ss',
    minTime,
    maxTime,
    minSelectableRange: [[MIN_TIME, maxTime]],
    maxSelectableRange: [[minTime, MAX_TIME]],
    btnDisabled: isDisabled(minTime, maxTime),
  }
  state.isShowSeconds = (state.format || '').indexOf('ss') !== -1

  return state
}

export default class TimeRangePanel extends Component {

  static get propTypes() {
    return Object.assign({},
      {
        pickerWidth: PropTypes.number,
        currentDates: PropTypes.arrayOf(PropTypes.instanceOf(Date)),
        /*
        onPicked: (value, isKeepPannelOpen)=>()
      
        @param value: Date| Date[] |null
        @param isKeepPannelOpen:boolean, should parent close the pannel
        */
        onPicked: PropTypes.func.isRequired,
        // cancel btn is clicked
        //()=>()
        onCancel: PropTypes.func.isRequired,
        // (start, end)=>(), index range indicate which field [hours, minutes, seconds] changes
        onSelectRangeChange: TimeSpinner.propTypes.onSelectRangeChange,
        //()=>HtmlElement
        getPopperRefElement: PropTypes.func,//todo: make this dry
        popperMixinOption: PropTypes.object
      })
  }

  static get defaultProps() {
    return {
      popperMixinOption: {}
    }
  }

  constructor(props) {
    super(props)

    this.state = Object.assign({
      visible: false,
      width: 0
    }, mapPropsToState(props))

    PopperReactMixin.call(this, () => this.refs.root, props.getPopperRefElement, Object.assign({
      boundariesPadding: 0,
      gpuAcceleration: false
    }, props.popperMixinOption));

  }

  componentWillReceiveProps(nextProps){
    this.setState(mapPropsToState(nextProps))
  }

  // type: string,  one of [hours, minutes, seconds]
  // date: {type: number}
  handleChange(date, field) {
    const ndate = this.state[field]

    if (date.hours !== undefined) {
      ndate.setHours(date.hours);
    }

    if (date.minutes !== undefined) {
      ndate.setMinutes(date.minutes);
    }

    if (date.seconds !== undefined) {
      ndate.setSeconds(date.seconds);
    }

    const state = {
      [field]: ndate
    }

    const {minTime, maxTime} = this.state
    if (minTime > maxTime) {
      this.setState(state)
    } else {
      state.minSelectableRange = [[MIN_TIME, maxTime]];
      state.maxSelectableRange = [[minTime, MAX_TIME]];

      state.minTime = limitRange(minTime, state.minSelectableRange);
      state.maxTime = limitRange(maxTime, state.maxSelectableRange);

      this.setState(state)
      this.handleConfirm(true);
    }
  }


  handleConfirm(isKeepPannelOpen = false) {
    const {minTime, maxTime} = this.state
    const {onPicked} = this.props

    onPicked([minTime, maxTime], isKeepPannelOpen)
  }

  render() {
    
    const {
      isShowSeconds, minTime, maxTime, btnDisabled, minSelectableRange, maxSelectableRange
    } = this.state
    const {onSelectRangeChange} = this.props
    const $t = Locale.t
    const maxHours = maxTime.getHours()
    const maxMinutes = maxTime.getMinutes()
    const maxSeconds = maxTime.getSeconds()
    const minHours = minTime.getHours()
    const minMinutes = minTime.getMinutes()
    const minSeconds = minTime.getSeconds()
    return (
      <div
        ref="root"
        className="el-time-range-picker el-picker-panel" style={{minWidth: '330px'}}>
        <div className="el-time-range-picker__content">
          <div className="el-time-range-picker__cell">
            <div className="el-time-range-picker__header">{$t('el.datepicker.startTime')}</div>
            <div className="el-time-range-picker__body el-time-panel__content">
              <TimeSpinner
                ref="minSpinner"
                onChange={(date) => this.handleChange(date, 'minTime')}
                isShowSeconds={isShowSeconds}
                hours={minHours}
                minutes={minMinutes}
                seconds={minSeconds}
                selectableRange={minSelectableRange}
                onSelectRangeChange={onSelectRangeChange}
                />
            </div>
          </div>
          <div className="el-time-range-picker__cell">
            <div className="el-time-range-picker__header">{$t('el.datepicker.endTime')}</div>
            <div className="el-time-range-picker__body el-time-panel__content">
              <TimeSpinner
                ref="maxSpinner"
                onChange={(date) => this.handleChange(date, 'maxTime')}
                isShowSeconds={isShowSeconds}
                hours={maxHours}
                minutes={maxMinutes}
                seconds={maxSeconds}
                selectableRange={maxSelectableRange}
                onSelectRangeChange={(start, end) => onSelectRangeChange(start + 11, end + 11)}
                />
            </div>
          </div>
        </div>
        <div className="el-time-panel__footer">
          <button
            type="button"
            className="el-time-panel__btn cancel"
            onClick={() => this.props.onCancel()}>{$t('el.datepicker.cancel')}</button>
          <button
            type="button"
            className="el-time-panel__btn confirm"
            onClick={() => this.handleConfirm()}
            disabled={btnDisabled}>{$t('el.datepicker.confirm')}</button>
        </div>
      </div>
    )
  }
}