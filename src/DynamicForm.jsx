import React, { useState } from "react";
import { formatPhoneNumber } from "./phoneFormat";

// schema: array of field definitions
// initialValues: object with initial values for each field
// onSubmit: function(values)
export default function DynamicForm({ schema, initialValues = {}, onSubmit, customFieldsSchema = [], initialCustomFields = {} }) {
  const [values, setValues] = useState(() => {
    const v = {};
    schema.forEach(f => {
      if (f.type === "file") {
        v[f.name] = initialValues[f.name] || [];
      } else {
        v[f.name] = initialValues[f.name] || f.default || "";
      }
      if (f.type === "tel" && f.countrySelect) {
        v[`${f.name}_country`] = initialValues[`${f.name}_country`] || f.allowedCountries?.[0] || "US";
      }
    });
    if (Array.isArray(customFieldsSchema)) {
      customFieldsSchema.forEach(f => {
        v[f.name] = initialCustomFields[f.name] || f.default || "";
      });
    }
    return v;
  });
  const [errors, setErrors] = useState({});

  // US/UK phone regex
  const phonePatterns = {
    US: /^\(?([2-9][0-9]{2})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/,
    UK: /^\+?44\s?7\d{3}|\(?07\d{3}\)?\s?\d{3}\s?\d{3}$/
  };

  function validate() {
    const errs = {};
    schema.forEach(f => {
      const val = values[f.name];
      if (f.required && !val) {
        errs[f.name] = "Required";
      } else if (f.minLength && val.length < f.minLength) {
        errs[f.name] = `Minimum ${f.minLength} characters`;
      } else if (f.maxLength && val.length > f.maxLength) {
        errs[f.name] = `Maximum ${f.maxLength} characters`;
      } else if (f.type === "email" && val && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(val)) {
        errs[f.name] = "Invalid email";
      } else if (f.type === "tel" && val && f.countrySelect) {
        const country = values[`${f.name}_country`] || f.allowedCountries?.[0] || "US";
        const pattern = phonePatterns[country];
        if (pattern && !pattern.test(val)) {
          errs[f.name] = `Invalid ${country} phone number`;
        }
      }
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function maskPhoneInput(val, country) {
      // Validate custom fields
      customFieldsSchema.forEach(f => {
        const val = values[f.name];
        if (f.required && !val) {
          errs[f.name] = "Required";
        } else if (f.minLength && val.length < f.minLength) {
          errs[f.name] = `Minimum ${f.minLength} characters`;
        } else if (f.maxLength && val.length > f.maxLength) {
          errs[f.name] = `Maximum ${f.maxLength} characters`;
        }
      });
    // Only mask for US/UK, fallback to raw for others
    if (country === "US" || country === "UK") {
      return formatPhoneNumber(val.replace(/\D/g, ""), country);
    }
    return val;
  }

  function handleChange(e, f, isCountry) {
    if (isCountry) {
      setValues(v => ({ ...v, [`${f.name}_country`]: e.target.value }));
    } else if (f.type === "tel" && f.countrySelect) {
      const country = values[`${f.name}_country`] || f.allowedCountries?.[0] || "US";
      const raw = e.target.value.replace(/\D/g, "");
      setValues(v => ({ ...v, [f.name]: maskPhoneInput(raw, country) }));
    } else if (f.type === "file") {
      // Convert FileList to array of objects with filename, url, type
      const files = Array.from(e.target.files).map(file => ({
        filename: file.name,
        url: URL.createObjectURL(file),
        type: file.type
      }));
      setValues(v => ({ ...v, [f.name]: files }));
    } else {
      setValues(v => ({ ...v, [f.name]: e.target.value }));
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (validate()) {
      // Remove country fields from values if not needed in output
      const output = { ...values };
      schema.forEach(f => {
        if (f.type === "tel" && f.countrySelect) {
          output[`${f.name}_country`] = values[`${f.name}_country`];
        }
      });
      // Group custom fields into a customFields object
      const customFields = {};
      if (Array.isArray(customFieldsSchema)) {
        customFieldsSchema.forEach(f => {
          customFields[f.name] = values[f.name];
        });
      }
      onSubmit({ ...output, customFields });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {schema.map(f => (
        <div key={f.name}>
          <label className="block font-medium mb-1">
            {f.label}
            {f.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {f.type === "select" ? (
            <select
              className="border rounded px-2 py-1 w-full"
              value={values[f.name]}
              onChange={e => handleChange(e, f)}
            >
              {f.options.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          ) : f.type === "textarea" ? (
            <textarea
              className="border rounded px-2 py-1 w-full"
              value={values[f.name]}
              onChange={e => handleChange(e, f)}
              rows={4}
            />
          ) : f.type === "tel" && f.countrySelect ? (
            <div className="flex gap-2">
              <select
                className="border rounded px-2 py-1"
                value={values[`${f.name}_country`] || f.allowedCountries?.[0] || "US"}
                onChange={e => handleChange(e, f, true)}
              >
                {(f.allowedCountries || ["US", "UK"]).map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <input
                className="border rounded px-2 py-1 w-full"
                type="tel"
                value={values[f.name]}
                onChange={e => handleChange(e, f)}
                placeholder={values[`${f.name}_country`] === "UK" ? "+44 7xxx xxx xxx" : "(555) 555-5555"}
                maxLength={values[`${f.name}_country`] === "UK" ? 15 : 14}
              />
            </div>
          ) : f.type === "date" ? (
            <input
              className="border rounded px-2 py-1 w-full"
              type="date"
              value={values[f.name]}
              onChange={e => handleChange(e, f)}
            />
          ) : f.type === "file" ? (
            <>
              <input
                className="border rounded px-2 py-1 w-full"
                type="file"
                multiple={f.multiple}
                accept={f.accept || undefined}
                onChange={e => handleChange(e, f)}
              />
              {Array.isArray(values[f.name]) && values[f.name].length > 0 && (
                <div className="mt-2 space-y-1">
                  {values[f.name].map((file, idx) =>
                    file && typeof file === 'object' && file.url && file.filename ? (
                      <div key={file.url || file.filename} className="flex items-center gap-2">
                        {file.type && file.type.startsWith('image') ? (
                          <img src={file.url} alt={file.filename} className="w-12 h-12 object-cover rounded border" />
                        ) : (
                          <span className="inline-block w-12 h-12 bg-gray-200 rounded border flex items-center justify-center text-gray-500">📄</span>
                        )}
                        <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-sm">{file.filename}</a>
                      </div>
                    ) : null
                  )}
                </div>
              )}
            </>
          ) : (
            <input
              className="border rounded px-2 py-1 w-full"
              type={f.type === "email" || f.type === "tel" ? f.type : "text"}
              value={values[f.name]}
              onChange={e => handleChange(e, f)}
            />
          )}
          {errors[f.name] && (
            <div className="text-red-500 text-sm mt-1">{errors[f.name]}</div>
          )}
        </div>
      ))}
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Submit</button>
    </form>
  );
}
