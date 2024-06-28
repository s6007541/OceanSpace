import './monitor.css';
import React from 'react';
import Start from './monitor_components/Start';
import Quiz from './monitor_components/Quiz';
import Result from './monitor_components/Result';
import Loading from './monitor_components/Loading';

import { DataProvider } from './monitor_context/dataContext';

function Monitor() {
  return (
    <DataProvider>
      {/* Welcome Page */}
      
      <Start/>

      {/* Quiz Page */}
      <Quiz/>

      {/* Result Page */}
      <Result/>
      
      <Loading/>

    </DataProvider>
  );
}

export default Monitor;
