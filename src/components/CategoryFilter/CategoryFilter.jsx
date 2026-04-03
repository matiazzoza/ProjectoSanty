import { CATEGORIES } from "../../data/mockReports";
import "./CategoryFilter.scss";

export default function CategoryFilter({ selected, onChange }) {
  return (
    <div className="category-filter">
      <button
        className={`category-filter__btn ${!selected ? "category-filter__btn--active" : ""}`}
        onClick={() => onChange(null)}
      >
        Todos
      </button>
      {CATEGORIES.map((cat) => (
        <button
          key={cat.id}
          className={`category-filter__btn ${selected === cat.id ? "category-filter__btn--active" : ""}`}
          onClick={() => onChange(cat.id)}
        >
          {cat.icon} {cat.label}
        </button>
      ))}
    </div>
  );
}
