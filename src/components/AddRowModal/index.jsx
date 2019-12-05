import React, {
  useCallback,
  useEffect,
  useState,
  useMemo,
  useRef
} from "react";
import PropTypes from "prop-types";
import {
  isDefined,
  identity,
  isNil,
  binarySearch,
  createObject
} from "Utility";

import { Modal, Button, Form } from "react-bootstrap";

import "./style.scss";

console.log(Modal);
function AddRowModal({ data, show, columns, onHide, onAdd, title, ...rest }) {
  // Filter columns based on whether they should have a field
  const relevantColumns = useMemo(
    () => columns.filter(col => col.hasAddField),
    [columns]
  );
  const relevantColumnsMap = useMemo(
    () =>
      Object.assign(
        {},
        ...relevantColumns.map(({ key, ...rest }) => ({ [key]: rest }))
      ),
    [relevantColumns]
  );

  // Controlled input values
  const [values, setValues] = useState(() =>
    calculateInitialState(relevantColumns)
  );
  useEffect(() => setValues(calculateInitialState(relevantColumns)), [
    relevantColumns
  ]);
  const onChange = useCallback(
    (key, event) => {
      let processFunc = relevantColumnsMap[key].processValue;
      if (isNil(processFunc)) processFunc = identity;
      const newValue = isDefined(event.target) ? event.target.value : "";
      setValues({
        ...values,
        [key]: processFunc(newValue)
      });
    },
    [values, relevantColumnsMap]
  );

  // Memoize sorted unique columns to enable binary search
  const sortedUniqueColumns = useMemo(() => {
    // Skip updates if not rendering
    if (!show) return [];
    else {
      let uniqueColumns = columns.filter(c => c.unique).map(c => c.key);
      if (uniqueColumns.length === 0) return [];
      let sorted = createObject();
      for (const col of uniqueColumns) {
        sorted[col] = [];
      }
      for (const row of data) {
        for (const col of uniqueColumns) {
          sorted[col].push(row[col]);
        }
      }
      for (const col of uniqueColumns) {
        sorted[col].sort();
      }
      return sorted;
    }
  }, [columns, data, show]);

  // Auto-focus first input field
  const firstInput = useRef(null);
  useEffect(() => {
    if (show && isDefined(firstInput.current)) firstInput.current.focus();
  }, [show]);

  // Input validation calculation & status
  const [showValidation, setShowValidation] = useState(false);
  const [validationStatus, isValid] = useMemo(() => {
    let validationStatus = {};
    let allPass = true;
    for (const i in relevantColumns) {
      const { key, required, name, validator, unique } = relevantColumns[i];
      const value = values[key];
      if (required) {
        // Validate based on empty or not
        if (value.trim().length === 0) {
          validationStatus[key] = {
            result: false,
            message: `${name} is a required field`
          };
          allPass = false;
          continue;
        }
      }

      if (unique) {
        let index = binarySearch(sortedUniqueColumns[key], value);
        if (index !== -1) {
          validationStatus[key] = {
            result: false,
            message: `${name} must be unique`
          };
          allPass = false;
          continue;
        }
      }

      // Custom validator
      if (isDefined(validator)) {
        const result = validator(value);
        if (typeof result === "boolean") {
          allPass = allPass && result;
          validationStatus[key] = {
            result,
            message: ""
          };
        } else {
          allPass = allPass && result.result;
          validationStatus[key] = result;
        }
      }
    }
    return [validationStatus, allPass];
  }, [relevantColumns, values, sortedUniqueColumns]);

  // Reset state to initial
  const resetState = useCallback(() => {
    setValues(calculateInitialState(relevantColumns));
    setShowValidation(false);
    setFinishedInputs(calculateInitialFocusState(relevantColumns));
  }, [relevantColumns]);

  // On submit
  const tryAdd = useCallback(() => {
    if (isValid) {
      resetState();
      onAdd(values);
    } else {
      setShowValidation(true);
    }
  }, [isValid, values, onAdd, resetState]);

  // On close
  const close = useCallback(() => {
    resetState();
    onHide();
  }, [resetState, onHide]);

  // Enter press handler
  const handleKeyPressed = useCallback(
    e => {
      var code = e.keyCode || e.which;
      // Enter keycode
      if (code === 13) {
        tryAdd();
      }
    },
    [tryAdd]
  );
  useEffect(() => {
    if (show) {
      document.addEventListener("keydown", handleKeyPressed, false);
      return () =>
        document.removeEventListener("keydown", handleKeyPressed, false);
    }
  }, [show, handleKeyPressed]);

  // Validate upon lost focus
  const [finishedInputs, setFinishedInputs] = useState(
    calculateInitialFocusState(relevantColumns)
  );
  const onBlur = useCallback(
    key => {
      if (values[key] !== "")
        setFinishedInputs({ ...finishedInputs, [key]: true });
    },
    [values, finishedInputs]
  );

  // Whether a column should appear with a validation outline
  const validated = useCallback(
    col => showValidation || finishedInputs[col.key],
    [showValidation, finishedInputs]
  );

  return (
    <Modal
      size="lg"
      aria-labelledby="add-row-header"
      centered
      onHide={close}
      className="add-row-modal"
      restoreFocus={false}
      scrollable
      show={show}
      {...rest}
    >
      <Modal.Header closeButton>
        <Modal.Title id="add-row-header">
          {isDefined(title) ? title : "Add a new row"}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form noValidate>
          {relevantColumns.map((col, i) => (
            <Form.Group controlId={`addRowForm-${col.key}`} key={col.key}>
              <Form.Label>{col.name}</Form.Label>
              <FormInput
                type="text"
                inputKey={col.key}
                placeholder={`Enter ${col.name.toLowerCase()}`}
                onChange={onChange}
                onBlur={onBlur}
                value={values[col.key]}
                isValid={validated(col) && validationStatus[col.key].result}
                isInvalid={validated(col) && !validationStatus[col.key].result}
                ref={i === 0 ? firstInput : undefined}
              />
              <Form.Control.Feedback type="invalid">
                {validationStatus[col.key].message}
              </Form.Control.Feedback>
              {isDefined(col.info) ? (
                <Form.Text className="text-muted">{col.info}</Form.Text>
              ) : (
                undefined
              )}
            </Form.Group>
          ))}
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={close} variant="outline-primary" className="px-4 mr-3">
          Cancel
        </Button>
        <Button onClick={tryAdd} className="px-4" disabled={!isValid}>
          Add
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default AddRowModal;

AddRowModal.propTypes = {
  columns: PropTypes.arrayOf(PropTypes.object),
  onHide: PropTypes.func.isRequired,
  onAdd: PropTypes.func.isRequired,
  title: PropTypes.string,
  show: PropTypes.bool,
  data: PropTypes.arrayOf(PropTypes.object)
};

AddRowModal.defaultProps = {
  columns: [],
  title: null,
  show: false,
  data: []
};

AddRowModal.displayName = "AddRowModal";

// ? ==============
// ? Sub-components
// ? ==============

const FormInput = React.forwardRef(
  ({ onChange, onBlur, inputKey, ...rest }, ref) => (
    <Form.Control
      onChange={useCallback(e => onChange(inputKey, e), [onChange, inputKey])}
      onBlur={useCallback(() => onBlur(inputKey), [onBlur, inputKey])}
      ref={ref}
      {...rest}
    />
  )
);

FormInput.propTypes = {
  onChange: PropTypes.func.isRequired,
  inputKey: PropTypes.string.isRequired,
  onBlur: PropTypes.func
};

FormInput.defaultProps = {
  onBlur() {}
};

// ? =================
// ? Utility functions
// ? =================

function calculateInitialState(columns) {
  const state = createObject();
  for (let i = 0; i < columns.length; ++i) {
    state[columns[i].key] = "";
  }
  return state;
}

function calculateInitialFocusState(columns) {
  const state = createObject();
  for (let i = 0; i < columns.length; ++i) {
    state[columns[i].key] = false;
  }
  return state;
}
