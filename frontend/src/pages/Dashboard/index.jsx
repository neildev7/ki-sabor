import React from 'react';
import './Dashboard.css';

export default function Dashboard() {
    return (
        <div className="dashboard-python-container">
            {/* O iframe é a "janela" que mostra o Python */}
            {/* O "?embed=true" no final do link é um truque do Streamlit para esconder o menu superior deles e parecer nativo do seu site! */}
            <iframe 
                src="http://localhost:8501/?embed=true" 
                title="Ki-Sabor BI"
                className="iframe-python"
            />
        </div>
    );
}