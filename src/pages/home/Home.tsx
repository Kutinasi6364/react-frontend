import React, { useEffect, useState } from 'react';
import { fetchEquityHubs, registerEquity, handleBuy, handleDelete, updateStockData } from '../apiService';

interface EquityHub {
    stock_No: number;
    symbol: string;
    name: string;
    dividend_yield: number;
    price: number;
    shares_owned: number;
}

const StockHoldings = () => {
  const [equityHubs, setEquityHubs] = useState<EquityHub[]>([]);
  const [tickerSymbol, setTickerSymbol] = useState('');
  const [shares, setShares] = useState<{ [key: number]: number }>({}); // 銘柄ごとの株数を管理
  const [isLoading, setIsLoading] = useState(false); // ローディング状態を管理

  // 初期データを取得
  useEffect(() => {
    fetchEquityHubs(setEquityHubs);
  }, []);

  // 株式登録
  const handleBuyClick = async () => {
    await handleBuy(shares, setShares, () => fetchEquityHubs(setEquityHubs));
  };

  // 株式登録削除
  const handleDeleteClick = async (stock_No: number) => {
    await handleDelete(stock_No, () => fetchEquityHubs(setEquityHubs));
  };

  // 銘柄登録
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await registerEquity(tickerSymbol, () => fetchEquityHubs(setEquityHubs));
    setTickerSymbol(''); // フォームをリセット
  };

  // 銘柄最新情報更新
  const hundleUpdate = async () => {
    setIsLoading(true);
      await updateStockData(() => fetchEquityHubs(setEquityHubs));
    setIsLoading(false);
    alert('最新株価情報を更新しました。');
  }

  // 金額をフォーマットする
  const formatCurrency = (value: number) => {
    return `${value.toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')} JPN`;
  };

  // 購入額を計算
  const totalBuyAmount = equityHubs.reduce((total, hub) => {
    const enteredShares = shares[hub.stock_No] || 0;
    return total + (hub.price * enteredShares);
  }, 0);

  // 配当予想額の合計を計算する
  const totalDividendForecast = equityHubs.reduce((total, hub) => {
    return total + (hub.price * (hub.dividend_yield/100) * hub.shares_owned);
  }, 0);

  // 購入予定株を加味した全体配当額を計算
  const newTotalDividendForecast = equityHubs.reduce((total, hub) => {
    const enteredShares = shares[hub.stock_No] || 0;
    return total + (hub.price * (hub.dividend_yield/100) * (enteredShares + hub.shares_owned));
  }, 0);

  // 配当予想額で並び替え
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc'または'desc'
  const sortStocks = () => {
    const sortedStocks = [...equityHubs].sort((a, b) => {
      // Calculate new percentage for both stocks
      const enteredSharesA = shares[a.stock_No] || 0;
      const enteredSharesB = shares[b.stock_No] || 0;
  
      const newDividendForecastA = a.price * (a.dividend_yield / 100) * (enteredSharesA + a.shares_owned);
      const newDividendForecastB = b.price * (b.dividend_yield / 100) * (enteredSharesB + b.shares_owned);
      
      const newTotalDividendForecast = equityHubs.reduce((total, hub) => {
        const enteredShares = shares[hub.stock_No] || 0;
        return total + (hub.price * (hub.dividend_yield / 100) * (enteredShares + hub.shares_owned));
      }, 0);
  
      const newPercentageA = newTotalDividendForecast > 0 ? (newDividendForecastA / newTotalDividendForecast) * 100 : 0;
      const newPercentageB = newTotalDividendForecast > 0 ? (newDividendForecastB / newTotalDividendForecast) * 100 : 0;
  
      // Sort based on the new percentages
      return sortOrder === 'asc' ? newPercentageA - newPercentageB : newPercentageB - newPercentageA;
    });
    setEquityHubs(sortedStocks);
  };
  
  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc')); // Toggle sort order
    sortStocks();
  };


  return (
    <div className="container-fluid h-100 mt-3">
      <h4>List of Stock Holdings.</h4>
      <div className="ms-3 d-md-flex justify-content-md-between">
        <div className="ms-3 col-12" style={{ flex: '4' }}> 
          <form onSubmit={handleSubmit}> {/* 銘柄登録のフォーム */}
            <input
              type="text"
              value={tickerSymbol}
              onChange={(e) => setTickerSymbol(e.target.value)}
              placeholder="Equity Symbol Number."
            />
            <button type="submit">登録</button>
          </form>
        </div>
        <div style={{ flex: '1', textAlign: 'right' }}>
          <button className="btn btn-primary" onClick={hundleUpdate} disabled={isLoading}>
            {isLoading ? '更新中...' : '更新'}
          </button>
          {isLoading && (
            <span className="spinner-overlay">
              <span className="spinner">Loading...</span>
            </span>
          )}
        </div>
      </div>
      <div className="m-3 col-12">
        <ul className="list-group list-group-horizontal">
          <li className="list-group-item col active" style={{ flex: '2' }} aria-current="true">銘柄名(コード)</li>
          <li className="list-group-item col active" style={{ flex: '1' }}  aria-current="true">現在価値(円)</li>
          <li className="list-group-item col active" style={{ flex: '1' }}  aria-current="true">配当予想(%)</li>
          <li className="list-group-item col active" style={{ flex: '1' }}  aria-current="true">現在持株数</li>
          <li className="list-group-item col active" style={{ flex: '1' }}  aria-current="true">配当予想額(円)</li>
          <li className="list-group-item col active" style={{ flex: '1' }}  aria-current="true">配当額/全体配当額</li>
          <li className="list-group-item col active" style={{ flex: '1' }}  aria-current="true">購入数</li>
          <li className="list-group-item col active" style={{ flex: '1' }}  aria-current="true">購入後配当額</li>
          <li className="list-group-item col active" style={{ flex: '1' }}  aria-current="true">購入後配当額/全体配当額
            <button onClick={toggleSortOrder}>{sortOrder === 'asc' ? '降順' : '昇順'}</button>
          </li>
        </ul>
        {equityHubs.map((content) => {
          const dividendForecast = content.price * (content.dividend_yield/100) * content.shares_owned;
          const percentage = totalDividendForecast > 0 ? (dividendForecast / totalDividendForecast) * 100 : 0
          

          // 購入予定数に対する配当額を計算
          const enteredShares = shares[content.stock_No] || 0;
          const newDividendForecast  = (content.price * (content.dividend_yield/100) * (enteredShares + content.shares_owned));
          const newPercentage = newTotalDividendForecast > 0 ? (newDividendForecast / newTotalDividendForecast) * 100 : 0;

          return (
            <ul className="list-group list-group-horizontal" key={content.stock_No}>
              <li className="list-group-item col" style={{ flex: '2' }} >{content.name}({content.symbol})
                <button type="button" className="btn-close" style={{ flex: '1' }} aria-label="Close" onClick={() => handleDeleteClick(content.stock_No)}></button>
              </li> {/*銘柄名(コード) */}
              <li className="list-group-item col" style={{ flex: '1' }}>{formatCurrency(content.price)}</li> {/*現在価値 */}
              <li className="list-group-item col" style={{ flex: '1' }}>{content.dividend_yield}</li> {/*配当予想 */}
              <li className="list-group-item col" style={{ flex: '1' }}>{content.shares_owned}</li> {/*現在持有数 */}
              <li className="list-group-item col" style={{ flex: '1' }}>{formatCurrency(dividendForecast)}</li> {/*配当予想額 */}
              <li className="list-group-item col" style={{ flex: '1' }}>{percentage.toFixed(2)}%</li> {/*配当額/全体配当額 */}
              <li className="list-group-item col" style={{ flex: '1' }}>
                <input
                  className="form-control"
                  type="number"
                  value={enteredShares}
                  onChange={(e) =>  {
                    const value = Number(e.target.value);
                    setShares(prev => ({...prev, [content.stock_No]: value})); // 株数更新
                  }}
                  placeholder="購入予定の株数を入力"
                />
              </li>
              <li className="list-group-item col" style={{ flex: '1' }}>{formatCurrency(newDividendForecast)}</li> {/*購入後配当額 */}
              <li className="list-group-item col" style={{ flex: '1' }}>{newPercentage.toFixed(2)}%</li> {/*購入後配当額/全体配当額 */}
            </ul>
          )
        })}
      </div>
      <div className="ms-3 d-md-flex justify-content-md-start">
        <div className="me-3" style={{ flex: '1' }}>
            <p className="text-left">購入額: {formatCurrency(totalBuyAmount)}</p>
        </div>
        <div className="ms-3" style={{ flex: '3' }}>
            <p className="text-left">差額: {formatCurrency(newTotalDividendForecast - totalDividendForecast)}</p>
        </div>
        <div className="ms-3" style={{ flex: '1' }}>
          <button type="button" className="btn btn-primary ms-3" onClick={handleBuyClick}>購入数反映</button>
        </div>
      </div>
    </div>
  );
};

export default StockHoldings;
