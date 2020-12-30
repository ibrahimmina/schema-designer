/**
 * @flow
 */
import React, { Component } from 'react';
import Modal from 'react-bootstrap/lib/Modal';
import classnames from 'classnames';
import findIndex from 'lodash/findIndex';
import ForeignKeyForm from './ForeignKeyForm';
import type { ColumnType, TableType } from '../../utils/flowtypes';
import { isFractionType } from '../../utils/helpers';

type Props = {
    showColumnModal: boolean,
    editMode: boolean,
    editData: ColumnType,
    tableId: string,
    tables: Array<TableType>,
    columns: {
        [tableId: string]: Array<ColumnType>
    },
    toggleColumnModal: () => void,
    saveColumn: (data: ColumnType, tableId: string, hideModal?: boolean) => void,
    updateColumn: (data: ColumnType, tableId: string) => void
};

type State = {
    columnType: string,
    duplicateName: boolean,
    foreignKeyEnabled: boolean,
    isUnsigned: boolean
};

class ColumnModal extends Component<Props, State> {
    state = {
        columnType: '',
        duplicateName: false,
        foreignKeyEnabled: false,
        isUnsigned: false
    }

    // Flow type for refs
    name: any
    type: any
    length: any
    defValue: any
    comment: any
    autoInc: any
    nullable: any
    unique: any
    index: any
    unsigned: any
    foreignKey: any
    form: any

    componentWillReceiveProps(nextProps: Props) {
        // For edit action
        this.setState({
            columnType: nextProps.editData.type,
            duplicateName: false,
            foreignKeyEnabled: !!nextProps.editData.foreignKey.on.id,
            isUnsigned: nextProps.editData.unsigned
        });
    }

    getFormData = () => {
        const data = {
            name: this.name.value.trim().toLowerCase(),
            type: this.type.value,
            length: this.length.value.trim(),
            defValue: this.defValue.value.trim(),
            comment: this.comment.value.trim(),
            autoInc: this.autoInc.checked,
            nullable: this.nullable.checked,
            unique: this.unique.checked,
            index: this.index.checked,
            unsigned: this.unsigned.checked,
            foreignKey: {
                references: {
                    id: '',
                    name: ''
                },
                on: {
                    id: '',
                    name: ''
                }
            }
        };

        if (this.foreignKey) {
            data.foreignKey = this.foreignKey.getData();
        }

        if (!data.name) {
            return false;
        }

        const { tableId, columns, editData } = this.props;

        const duplicate = findIndex(columns[tableId], (column) => column.name === data.name);

        if (duplicate !== -1 && data.name !== editData.name) {
            // Duplicate column name
            this.setState({ duplicateName: true });
            return false;
        }

        // Reset all state variables
        this.setState({
            columnType: '',
            duplicateName: false,
            foreignKeyEnabled: false,
            isUnsigned: false
        });

        return data;
    }

    handleSubmit = (event: Event) => {
        event.preventDefault();
    }

    saveColumnAndContinue = () => {
        const data = this.getFormData();

        if (!data) {
            return;
        }

        const { saveColumn, tableId } = this.props;
        const hideModal = false;

        saveColumn({
            id: Math.random().toString(36).substring(7),
            ...data
        }, tableId, hideModal);

        this.form.reset();
    }

    saveColumnAndExit = () => {
        const data = this.getFormData();

        if (!data) {
            return;
        }

        const { saveColumn, updateColumn, editMode, editData, tableId } = this.props;

        if (editMode) {
            updateColumn({
                id: editData.id,
                ...data
            }, tableId);
        } else {
            saveColumn({
                id: Math.random().toString(36).substring(7),
                ...data
            }, tableId);
        }
    }

    updateColumnType = (event: { target: { value: string } }) => {
        this.setState({ columnType: event.target.value });
    }

    updateUnsignedValue = (event: { target: { checked: boolean } }) => {
        this.setState({
            isUnsigned: event.target.checked,
            foreignKeyEnabled: false
        });
    }

    updateForeignKeyValue = (event: { target: { checked: boolean } }) => {
        this.setState({ foreignKeyEnabled: event.target.checked });
    }

    render() {
        console.log('ColumnModal rendering'); // eslint-disable-line no-console
        const {
            columns,
            editData,
            editMode,
            showColumnModal,
            tables,
            toggleColumnModal
        } = this.props;
        const { columnType, duplicateName, foreignKeyEnabled, isUnsigned } = this.state;

        return (
            <Modal
                show={ showColumnModal }
                onHide={ toggleColumnModal }
            >
                <Modal.Header>
                    <button type='button' className='close' onClick={ toggleColumnModal }>
                        <span>&times;</span>
                    </button>
                    <Modal.Title>
                        { editMode ? 'Update Column' : 'Add Column' }
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <form
                        className='form-horizontal'
                        ref={ (form) => { this.form = form; } }
                        onSubmit={ this.handleSubmit }
                    >
                        <div className={ classnames('form-group', { 'has-error': duplicateName }) }>
                            <label className='col-xs-3 control-label' htmlFor='name'>Name:</label>
                            <div className='col-xs-9'>
                                <input
                                    type='text'
                                    id='name'
                                    ref={ (name) => { this.name = name; } }
                                    className='form-control'
                                    defaultValue={ editData.name }
                                    autoFocus
                                />
                            </div>

                            { duplicateName &&
                                <span className='col-xs-offset-3 col-xs-9 help-block'>
                                    Duplicate column name
                                </span>
                            }
                        </div>
                        <div className='form-group'>
                            <label className='col-xs-3 control-label' htmlFor='type'>Type:</label>
                            <div className='col-xs-9'>
                                <select
                                    className='form-control'
                                    id='type'
                                    ref={ (type) => { this.type = type; } }
                                    defaultValue={ columnType }
                                    onChange={ this.updateColumnType }
                                >
                                  <optgroup label="Integer">
                                    <option value="bigInteger">BIGINT</option>
                                    <option value="integer">INTEGER</option>
                                    <option value="mediumInteger">MEDIUMINT</option>
                                    <option value="smallInteger">SMALLINT</option>
                                    <option value="tinyInteger">TINYINT</option>
                                  </optgroup>
                                  <optgroup label="Numeric">
                                    <option value="decimal">DECIMAL</option>
                                    <option value="double">DOUBLE</option>
                                    <option value="float">FLOAT</option>
                                  </optgroup>
                                  <optgroup label="AlphaNumeric">
                                    <option value="char">CHAR</option>
                                    <option value="string">VARCHAR</option>
                                    <option value="longText">LONGTEXT</option>
                                    <option value="mediumText">MEDIUMTEXT</option>
                                    <option value="multiLineString">MULTILINESTRING</option>
                                    <option value="lineString">LINESTRING</option>
                                    <option value="text">TEXT</option>
                                  </optgroup>
                                  <optgroup label="Date and time">
                                    <option value="dateTime">DATETIME</option>
                                    <option value="dateTime">DATETIME LOCAL</option>
                                    <option value="date">DATE</option>
                                    <option value="timestamp">TIMESTAMP</option>
                                    <option value="timestamp">TIMESTAMP LOCAL</option>
                                    <option value="time">TIME</option>
                                    <option value="time">TIME LOCAL</option>
                                    <option value="year">YEAR</option>
                                    <option value="year">MONTH</option>
                                  </optgroup>

                                  <optgroup label="Address">
                                    <option value="string">ADDRESS</option>
                                    <option value="integer">TELEPHONE</option>
                                    <option value="string">ZIP</option>
                                    <option value="string">CITY</option>
                                    <option value="string">COUNTRY</option>
                                  </optgroup>

                                  <optgroup label="Authentication">
                                    <option value="string">EMAIL</option>
                                    <option value="string">PASSWORD</option>
                                    <option value="rememberToken">rememberToken</option>
                                  </optgroup>

                                  <optgroup label="Misc">
                                    <option value="macAddress">MAC</option>
                                    <option value="string">FILE</option>
                                    <option value="string">IMAGE</option>
                                    <option value="ip">IP</option>
                                    <option value="boolean">BOOLEAN</option>
                                    <option value="uuid">UUID</option>
                                  </optgroup>

                                  <optgroup label="Collection">
                                    <option value="binary" disabled>
                                      BLOB
                                    </option>
                                    <option value="enum" disabled>
                                      ENUM
                                    </option>
                                    <option value="json" disabled>
                                      JSON 
                                    </option>
                                    <option value="jsonb" disabled>
                                      JSONB
                                    </option>
                                    <option value="set" disabled>
                                      SET
                                    </option>
                                  </optgroup>

                                  <optgroup label="Morphs">
                                    <option value="nullableMorphs" disabled>
                                      morphs
                                    </option>
                                    <option value="nullableUuidMorphs" disabled>
                                      uuidMorphs
                                    </option>
                                    <option value="nullableUuidMorphs" disabled>
                                      uuidMorphs
                                    </option>
                                  </optgroup>

                                  <optgroup label="Geometry">
                                    <option value="geometryCollection" disabled>
                                      GEOMETRYCOLLECTION
                                    </option>
                                    <option value="geometry" disabled>
                                      GEOMETRY
                                    </option>
                                    <option value="multiPoint" disabled>
                                      MULTIPOINT
                                    </option>
                                    <option value="multiPolygon" disabled>
                                      MULTIPOLYGON
                                    </option>
                                    <option value="point" disabled>
                                      POINT
                                    </option>
                                    <option value="polygon" disabled>
                                      POLYGON
                                    </option>
                                  </optgroup>                                       
                                </select>
                            </div>
                        </div>
                        <div className='form-group'>
                            <label className='col-xs-3 control-label' htmlFor='length'>Length:</label>
                            <div className='col-xs-9'>
                                <input
                                    type='text'
                                    id='length'
                                    ref={ (length) => { this.length = length; } }
                                    className='form-control'
                                    defaultValue={ editData.length }
                                    placeholder={ !isFractionType(columnType) ? '' :
                                        'Use comma separated value for decimal, double or float'
                                    }
                                />
                            </div>
                        </div>
                        <div className='form-group'>
                            <label className='col-xs-3 control-label' htmlFor='defVal'>
                                Default Value:
                            </label>
                            <div className='col-xs-9'>
                                <input
                                    type='text'
                                    id='defVal'
                                    ref={ (defValue) => { this.defValue = defValue; } }
                                    className='form-control'
                                    defaultValue={ editData.defValue }
                                />
                            </div>
                        </div>
                        <div className='form-group'>
                            <label className='col-xs-3 control-label' htmlFor='comment'>Comment:</label>
                            <div className='col-xs-9'>
                                <input
                                    type='text'
                                    id='comment'
                                    ref={ (comment) => { this.comment = comment; } }
                                    className='form-control'
                                    defaultValue={ editData.comment }
                                />
                            </div>
                        </div>
                        <div className='form-group'>
                            <strong className='col-xs-3 control-label'>Misc:</strong>
                            <div className='col-xs-9'>
                                <label className='checkbox-inline' htmlFor='autoInc'>
                                    <input
                                        type='checkbox'
                                        id='autoInc'
                                        ref={ (autoInc) => { this.autoInc = autoInc; } }
                                        defaultChecked={ editData.autoInc }
                                    /> A.I.
                                </label>
                                <label className='checkbox-inline' htmlFor='nullable'>
                                    <input
                                        type='checkbox'
                                        id='nullable'
                                        ref={ (nullable) => { this.nullable = nullable; } }
                                        defaultChecked={ editData.nullable }
                                    /> Nullable
                                </label>
                                <label className='checkbox-inline' htmlFor='unique'>
                                    <input
                                        type='checkbox'
                                        id='unique'
                                        ref={ (unique) => { this.unique = unique; } }
                                        defaultChecked={ editData.unique }
                                    /> Unique
                                </label>
                                <label className='checkbox-inline' htmlFor='index'>
                                    <input
                                        type='checkbox'
                                        id='index'
                                        ref={ (index) => { this.index = index; } }
                                        defaultChecked={ editData.index }
                                    /> Index
                                </label>
                                <label className='checkbox-inline' htmlFor='unsigned'>
                                    <input
                                        type='checkbox'
                                        id='unsigned'
                                        ref={ (unsigned) => { this.unsigned = unsigned; } }
                                        checked={ isUnsigned }
                                        onChange={ this.updateUnsignedValue }
                                    /> Unsigned
                                </label>
                            </div>
                            <div className='col-xs-9 col-xs-offset-3'>
                                <label
                                    className={ classnames('checkbox-inline', { disabled: !isUnsigned }) }
                                    htmlFor='foreign'
                                >
                                    <input
                                        type='checkbox'
                                        id='foreign'
                                        checked={ foreignKeyEnabled }
                                        disabled={ !isUnsigned }
                                        onChange={ this.updateForeignKeyValue }
                                    /> Foreign Key
                                </label>
                            </div>
                        </div>

                        { foreignKeyEnabled &&
                            <ForeignKeyForm
                                ref={ (foreignKey) => { this.foreignKey = foreignKey; } }
                                columns={ columns }
                                tables={ tables }
                                data={ editData.foreignKey }
                            />
                        }
                    </form>
                </Modal.Body>

                <Modal.Footer className='modal-footer text-right'>
                    { !editMode &&
                        <button
                            type='button'
                            className='btn btn-primary'
                            onClick={ this.saveColumnAndContinue }
                        >Save &amp; Continue
                        </button>
                    }

                    <button type='button' className='btn btn-primary' onClick={ this.saveColumnAndExit }>
                        { editMode ? 'Update Column' : 'Save & Exit' }
                    </button>
                    <button
                        type='button'
                        className='btn btn-default'
                        onClick={ toggleColumnModal }
                    >Cancel
                    </button>
                </Modal.Footer>
            </Modal>
        );
    }
}

export default ColumnModal;
