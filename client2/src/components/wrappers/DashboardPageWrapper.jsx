import React from 'react';
import {  MD3SnackbarProvider } from '../Material3';
import DashboardPage from '../../pages/DashboardPage';

const DashboardPageWrapper = () => {
  return (
    <>
      <MD3SnackbarProvider>
        <DashboardPage />
      </MD3SnackbarProvider>
    </>
  );
};

export default DashboardPageWrapper;