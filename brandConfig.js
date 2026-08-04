export const BRANDS = {
    truist: {
        id: 'truist', label: 'Truist',
        primaryColor: '#5a3fc0', primaryDark: '#3d2a8a', primaryLight: '#f3f0fa',
        accentColor: '#5a3fc0', headerBg: '#fff', headerText: '#181818',
        logoText: 'T+', logoMark: 'TRUIST', font: "'SalesforceSans', sans-serif",
        buttonRadius: '6px', gaugeColor: '#5a3fc0'
    },
    ally: {
        id: 'ally', label: 'Ally Bank',
        primaryColor: '#6B3F96', primaryDark: '#4a2a6e', primaryLight: '#f5f0fc',
        accentColor: '#ff6200', headerBg: '#6B3F96', headerText: '#fff',
        logoText: 'A', logoMark: 'ALLY', font: "'SalesforceSans', sans-serif",
        buttonRadius: '24px', gaugeColor: '#ff6200'
    },
    citizens: {
        id: 'citizens', label: 'Citizens Bank',
        primaryColor: '#005C8E', primaryDark: '#003d60', primaryLight: '#e8f4fa',
        accentColor: '#00a651', headerBg: '#005C8E', headerText: '#fff',
        logoText: 'C', logoMark: 'CITIZENS', font: "'SalesforceSans', sans-serif",
        buttonRadius: '4px', gaugeColor: '#005C8E'
    },
    citi: {
        id: 'citi', label: 'Citi Bank',
        primaryColor: '#003B8E', primaryDark: '#00256a', primaryLight: '#e6edf8',
        accentColor: '#E31837', headerBg: '#003B8E', headerText: '#fff',
        logoText: 'C', logoMark: 'CITI', font: "'SalesforceSans', sans-serif",
        buttonRadius: '4px', gaugeColor: '#E31837'
    },
    bofa: {
        id: 'bofa', label: 'Bank of America',
        primaryColor: '#E31837', primaryDark: '#a8102a', primaryLight: '#fde8eb',
        accentColor: '#012169', headerBg: '#012169', headerText: '#fff',
        logoText: 'B', logoMark: 'BANK OF AMERICA', font: "'SalesforceSans', sans-serif",
        buttonRadius: '4px', gaugeColor: '#E31837'
    }
};

export const DEFAULT_BRAND = 'truist';

export function getBrand(brandId) {
    return BRANDS[brandId] || BRANDS[DEFAULT_BRAND];
}
