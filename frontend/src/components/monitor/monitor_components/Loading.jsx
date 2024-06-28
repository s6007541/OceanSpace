import React, { useContext } from 'react';
import DataContext from '../monitor_context/dataContext';
import "./loading.css";

const Loading = () => {
    const { showLoading }  = useContext(DataContext);
    return (
        <section className="loading_section" style={{ display: `${showLoading ? 'block' : 'none'}` }}>
            <div className="loading">Oceanspace is diving into your story!"</div>
        </section>
        
    );
};

export default Loading;