$folders = @(
    "app\(auth)\login",
    "app\(auth)\register",
    "app\(dashboard)\dashboard\settings",
    "app\book\[slug]",
    "app\api\appointments\[id]",
    "app\api\webhooks\payments",
    "components\ui",
    "components\dashboard",
    "components\booking",
    "components\auth",
    "lib\supabase",
    "types",
    "hooks",
    "styles"
)
foreach ($folder in $folders) {
    New-Item -ItemType Directory -Path $folder -Force | Out-Null
}

$files = @(
    "lib\supabase\client.ts",
    "lib\supabase\server.ts",
    "lib\utils.ts",
    "lib\validations.ts",
    "types\database.types.ts",
    "types\index.ts",
    "hooks\useSession.ts",
    "hooks\useSalon.ts",
    "hooks\useAppointments.ts",
    "hooks\useSubscription.ts",
    "components\ui\Button.tsx",
    "components\ui\Card.tsx",
    "components\ui\Badge.tsx",
    "components\ui\Input.tsx",
    "components\ui\Modal.tsx",
    "components\ui\Spinner.tsx",
    "components\dashboard\TodayAppointments.tsx",
    "components\dashboard\SubscriptionStatus.tsx",
    "components\dashboard\AppointmentCard.tsx",
    "components\booking\BookingWidget.tsx",
    "components\booking\ServiceSelector.tsx",
    "components\booking\TimeSlotPicker.tsx",
    "components\auth\RegisterStepper.tsx",
    "components\auth\SubscriptionGate.tsx",
    "app\(auth)\layout.tsx",
    "app\(auth)\login\page.tsx",
    "app\(auth)\register\page.tsx",
    "app\(dashboard)\layout.tsx",
    "app\(dashboard)\dashboard\page.tsx",
    "app\(dashboard)\dashboard\settings\page.tsx",
    "app\book\[slug]\page.tsx",
    "app\api\appointments\route.ts",
    "app\api\appointments\[id]\route.ts",
    "app\api\webhooks\payments\route.ts",
    "middleware.ts",
    "styles\design-tokens.css"
)
foreach ($f in $files) {
    New-Item -ItemType File -Path $f -Force | Out-Null
}

Write-Host "Estructura creada correctamente" -ForegroundColor Green