import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SustainabilityScore } from "@/components/ui/sustainability-score";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  sustainabilityScore: number;
  totalDecisions: number;
  createdAt: string;
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch("/api/auth/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("authToken");
          navigate("/login");
          return;
        }
        throw new Error("Failed to fetch profile");
      }

      const data = await response.json();
      setProfile(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-blue-50 p-4">
        <Card className="w-full max-w-md">
          <Alert variant="destructive">
            <p className="font-semibold">Error loading profile</p>
            <p className="text-sm mt-1">{error}</p>
            <Button onClick={() => navigate("/")} className="mt-4 w-full">
              Return to Home
            </Button>
          </Alert>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-blue-50">
        <Card>
          <p className="text-gray-600 mb-4">No profile data found</p>
          <Button onClick={() => navigate("/")} className="w-full">
            Return to Home
          </Button>
        </Card>
      </div>
    );
  }

  const memberSince = new Date(profile.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const avgScorePerDecision =
    profile.totalDecisions > 0
      ? (profile.sustainabilityScore / profile.totalDecisions).toFixed(1)
      : "0";

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold text-green-900 mb-2">
              {profile.name}
            </h1>
            <p className="text-gray-600">{profile.email}</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="border-red-200 text-red-600 hover:bg-red-50"
          >
            Logout
          </Button>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Sustainability Score Card */}
          <Card className="p-6 bg-white shadow-lg border-0">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Cumulative Sustainability Score
                </p>
                <h2 className="text-3xl font-bold text-green-600">
                  {Math.round(profile.sustainabilityScore)}
                </h2>
              </div>
              <SustainabilityScore score={profile.sustainabilityScore} />
            </div>
            <p className="text-xs text-gray-500">
              Based on {profile.totalDecisions} decision
              {profile.totalDecisions !== 1 ? "s" : ""}
            </p>
          </Card>

          {/* Decisions Card */}
          <Card className="p-6 bg-white shadow-lg border-0">
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-600 mb-1">
                Total Eco-Decisions Made
              </p>
              <h2 className="text-3xl font-bold text-blue-600">
                {profile.totalDecisions}
              </h2>
            </div>
            <p className="text-xs text-gray-500">
              Avg score per decision:{" "}
              <span className="font-semibold text-gray-700">
                {avgScorePerDecision}
              </span>
            </p>
          </Card>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-4 bg-white shadow-md border-0">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Member Since
              </p>
              <p className="text-lg font-semibold text-gray-900 mt-2">
                {memberSince}
              </p>
            </div>
          </Card>

          <Card className="p-4 bg-white shadow-md border-0">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Impact Level
              </p>
              <p className="text-lg font-semibold text-green-600 mt-2">
                {profile.sustainabilityScore >= 100
                  ? "Eco Champion"
                  : profile.sustainabilityScore >= 50
                    ? "Sustainability Leader"
                    : profile.sustainabilityScore >= 20
                      ? "Eco Conscious"
                      : "Getting Started"}
              </p>
            </div>
          </Card>

          <Card className="p-4 bg-white shadow-md border-0">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                CO2 Awareness
              </p>
              <p className="text-lg font-semibold text-blue-600 mt-2">
                {profile.sustainabilityScore > 0 ? "Active" : "Starting Out"}
              </p>
            </div>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 border-l-4 border-green-500">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Keep Making Eco-Friendly Choices
          </h3>
          <p className="text-gray-600 mb-6">
            Track more decisions to increase your sustainability impact score
            and become an eco champion!
          </p>
          <Button
            onClick={() => navigate("/")}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-2"
          >
            Make Another Decision →
          </Button>
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6 border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-3">
            How Your Score Works
          </h4>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start">
              <span className="mr-3 font-bold">•</span>
              <span>
                Each eco-friendly decision earns a sustainability score
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-3 font-bold">•</span>
              <span>Scores range from 3 (low impact) to 10 (high impact)</span>
            </li>
            <li className="flex items-start">
              <span className="mr-3 font-bold">•</span>
              <span>
                Your cumulative score reflects your total environmental impact
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-3 font-bold">•</span>
              <span>
                Higher scores mean more significant positive environmental
                choices
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
