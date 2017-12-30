import React, {Component} from 'react';
import classNames from 'classnames';

import {PrimitiveGroup as PrimitiveGroupModel} from '../parsers/primitives';
import {RenderedBlockNode} from './PrimitiveBlock';

require('./PrimitiveList.less');

export class Primitive extends Component {
  render() {
    var {primitive, className, onClick} = this.props;
    let astNode = primitive.getLiteralNode();
    return (
      <li className={classNames(className, "Primitive list-group-item")}
          onClick={onClick}>
        <RenderedBlockNode node={astNode} text={primitive.name} />
      </li>
    );
  }
}

export class PrimitiveGroup extends Component {
  static defaultProps = {
    group: {
      name: '',
      primitives: []
    },
    onSelect: null,
    selected: null,
  }

  state = {
    expanded: false
  }

  toggleExpanded = (_) => {
    this.setState({expanded: !this.state.expanded});
  }

  render() {
    let {group, onSelect, selected} = this.props;
    let expanded = this.state.expanded;
    let expandoClass = classNames(
      'glyphicon',
      expanded ? 'glyphicon-minus' : 'glyphicon-plus'
    );
    return (
      <li className="PrimitiveGroup list-group-item">
        <div onClick={this.toggleExpanded} className="group-header">
          <span className={expandoClass} aria-hidden="true"/>
        </div>
        {expanded ?
          <PrimitiveList
            primitives={group.primitives}
            onSelect={onSelect}
            selected={selected}
          />
          : null}
      </li>
    );
  }
}

export default class PrimitiveList extends Component {
  static defaultProps = {
    primitive: null,
    onSelect: null,
    selected: null,
  }

  render() {
    const {primitives, selected} = this.props;
    const onSelect = this.props.onSelect || function(){};
    let nodes = [];
    for (let primitive of primitives) {
      if (primitive instanceof PrimitiveGroupModel) {
        // this is a group.
        nodes.push(
          <PrimitiveGroup
            key={primitive.name}
            group={primitive}
            onSelect={onSelect}
            selected={selected}
          />
        );
        continue;
      }
      nodes.push(
        <Primitive
          key={primitive.name}
          primitive={primitive}
          onClick={() => onSelect(primitive)}
          className={selected == primitive && 'selected'}
        />
      );

    }
    return (
      <ul className="PrimitiveList list-group">{nodes}</ul>
    );
  }
}