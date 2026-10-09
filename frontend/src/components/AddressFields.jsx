import { PROVINCES } from '../data/provinces';

const input = 'w-full border border-sand rounded-xl px-4 py-3 bg-white';

// Campos de dirección reutilizables (registro, checkout, mi cuenta)
export default function AddressFields({ value, onChange }) {
  const set = (k) => (e) => onChange({ ...value, [k]: e.target.value });
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <input required placeholder="Calle" autoComplete="address-line1" className={`${input} col-span-2`}
          value={value.street} onChange={set('street')} />
        <input required placeholder="Altura" inputMode="numeric" className={input}
          value={value.number} onChange={set('number')} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <input placeholder="Piso / Depto (opcional)" autoComplete="address-line2" className={input}
          value={value.apartment} onChange={set('apartment')} />
        <input required placeholder="Código postal" autoComplete="postal-code" className={input}
          value={value.zip} onChange={set('zip')} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <input required placeholder="Localidad / Barrio" autoComplete="address-level2" className={input}
          value={value.city} onChange={set('city')} />
        <select required className={input} value={value.province} onChange={set('province')}>
          <option value="">Provincia</option>
          {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>
      <input placeholder="Entre calles / referencias para el repartidor (opcional)" className={input}
        value={value.notes} onChange={set('notes')} />
    </div>
  );
}
