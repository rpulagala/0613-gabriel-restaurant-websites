export function Footer() {
  return (
    <footer className="border-t bg-gray-50 py-8 text-center text-sm text-gray-500">
      <p className="font-medium text-gray-700">
        {process.env.NEXT_PUBLIC_RESTAURANT_NAME ?? 'Sizzling Wok'}
      </p>
      <p>{process.env.NEXT_PUBLIC_RESTAURANT_PHONE}</p>
      <p>{process.env.NEXT_PUBLIC_RESTAURANT_ADDRESS}</p>
    </footer>
  )
}
