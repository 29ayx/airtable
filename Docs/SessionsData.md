// In any component
import { useUser } from "@/hooks/use-session"

function MyComponent() {
  const { user, name, email, image, isLoading, isAuthenticated } = useUser();
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      <img src={image} alt={name} />
      <h1>Welcome, {name}!</h1>
      <p>{email}</p>
    </div>
  );
}