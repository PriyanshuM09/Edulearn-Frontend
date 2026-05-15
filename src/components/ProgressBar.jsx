const ProgressBar = ({ percent = 0, showLabel = true, size = 'md', color = 'blue' }) => {
  const clampedPercent = Math.min(100, Math.max(0, percent));

  const heights = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-4' };
  const colors = {
    blue: 'bg-blue-600',
    green: 'bg-green-500',
    purple: 'bg-purple-600',
    amber: 'bg-amber-500',
  };

  const barColor = clampedPercent === 100 ? 'bg-green-500' : (colors[color] || colors.blue);

  return (
    <div className="w-full">
      <div className={`w-full bg-gray-100 rounded-full overflow-hidden ${heights[size] || heights.md}`}>
        <div
          className={`${barColor} h-full rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${clampedPercent}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between items-center mt-1">
          <span className="text-xs text-gray-500">Progress</span>
          <span className={`text-xs font-semibold ${clampedPercent === 100 ? 'text-green-600' : 'text-blue-600'}`}>
            {clampedPercent}%
          </span>
        </div>
      )}
    </div>
  );
};

export default ProgressBar;
