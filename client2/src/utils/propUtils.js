// src/utils/propUtils.js
export const filterDOMProps = (props, allowedProps = []) => {
  const domProps = {};
  const componentProps = {};
  
  // Standard HTML attributes that are always allowed
  const standardHTMLProps = [
    'className', 'style', 'id', 'title', 'role', 'tabIndex',
    'onClick', 'onFocus', 'onBlur', 'onMouseEnter', 'onMouseLeave',
    'onKeyDown', 'onKeyUp', 'onKeyPress', 'aria-label', 'aria-labelledby',
    'aria-describedby', 'aria-expanded', 'aria-hidden', 'data-testid'
  ];
  
  Object.keys(props).forEach(key => {
    if (standardHTMLProps.includes(key) || allowedProps.includes(key)) {
      domProps[key] = props[key];
    } else {
      componentProps[key] = props[key];
    }
  });
  
  return { domProps, componentProps };
};