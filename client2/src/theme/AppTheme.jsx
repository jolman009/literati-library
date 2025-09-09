// src/theme/appTheme.jsx
import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import { inputsCustomizations } from './customizations/inputs';
import { dataDisplayCustomizations } from './customizations/dataDisplay';
import { feedbackCustomizations } from './customizations/feedback';
import { navigationCustomizations } from './customizations/navigation';
import { surfacesCustomizations } from './customizations/surfaces';
import { colorSchemes, typography, shadows, shape } from './themePrimitives';

/**
 * AppTheme
 * - Uses MUI v6 colorSchemes + CSS variables when available
 * - Degrades gracefully on MUI v5 (no colorSchemes/cssVariables)
 */
export default function AppTheme({ children, disableCustomTheme, themeComponents }) {
  const theme = useMemo(() => {
    if (disableCustomTheme) return {};

    // Detect if this MUI has v6 colorSchemes support
    const supportsV6 = typeof createTheme({}).colorSchemes !== 'undefined';

    const baseOptions = supportsV6
      ? {
          // v6 path
          cssVariables: {
            colorSchemeSelector: 'data-mui-color-scheme',
            cssVarPrefix: 'template',
          },
          colorSchemes, // light/dark definitions (from your themePrimitives)
          typography,
          shadows,
          shape,
          components: {
            ...inputsCustomizations,
            ...dataDisplayCustomizations,
            ...feedbackCustomizations,
            ...navigationCustomizations,
            ...surfacesCustomizations,
            ...themeComponents,
          },
        }
      : {
          // v5 fallback (no cssVariables / colorSchemes)
          palette: colorSchemes?.light?.palette || {},
          typography,
          shadows,
          shape,
          components: {
            ...inputsCustomizations,
            ...dataDisplayCustomizations,
            ...feedbackCustomizations,
            ...navigationCustomizations,
            ...surfacesCustomizations,
            ...themeComponents,
          },
        };

    return createTheme(baseOptions);
  }, [disableCustomTheme, themeComponents]);

  if (disableCustomTheme) return <>{children}</>;

  return (
    <ThemeProvider theme={theme} disableTransitionOnChange>
      {children}
    </ThemeProvider>
  );
}

AppTheme.propTypes = {
  children: PropTypes.node,
  disableCustomTheme: PropTypes.bool,
  themeComponents: PropTypes.object,
};

AppTheme.defaultProps = {
  disableCustomTheme: false,
  themeComponents: {},
};
