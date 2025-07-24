import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useAuthUser from "../hooks/useAuthUser";
import { completeOnboarding } from "../lib/api";
import { toast } from "react-hot-toast"
import {CameraIcon , GlobeIcon, LoaderIcon, MapPinIcon, ShuffleIcon, } from "lucide-react"
import { useState } from "react";
import { LANGUAGES } from "../constants";
import { generateImage } from "../lib/api";

const OnboardingPage = () => {

  const {authUser} = useAuthUser();
  const queryClient = useQueryClient;

  const [formState, setFormState] = useState({
    userName: authUser?.userName || "",
    bio: authUser?.bio || "",
    nativeLanguage: authUser?.nativeLanguage || "",
    learningLanguage: authUser?.learningLanguage || "",
    location: authUser?.location || "",
    profilePic: authUser?.profilePic || "",
  })

  const {mutate: onboardingMutation, isPending} = useMutation({
    mutationFn: completeOnboarding,
    onSuccess: () => {
      toast.success("Profile onboarded successfully");
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
    },

    onError: (error) => {
      toast.error(error.response.data.message,{
        duration:3000,
        id: "mutationError",
      });
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault();

    onboardingMutation(formState);
  }

  const {
    refetch: fetchRandomAvatar,
    isFetching: avatarLoading,
  } = useQuery({
    queryKey: ["randomAvatar"],
    queryFn: generateImage,
    enabled: false, // prevent auto-fetching on mount
  });

  const handleRandomAvatar = async () => {
    const { data,error, isError } = await fetchRandomAvatar();
    
    if(isError){
    toast.error("Failed to generate avatar.",{
      duration: 2000,
      id: "randomAvatar",
    });
    console.error("Avatar generation error:", error);
    return;
    }

    setFormState({...formState, profilePic: data?.image});
    toast.success("Random avatar generated!",{
      duration: 1000,
      id: "randomAvatar",
    });
  }



  return (
    <div className="min-h-screen bg-base-100 flex items-center justify-center p-4">
      <div className="card bg-base-200 w-full max-w-3xl shadow-xl">
        <div className="card-body p-6 sm:p-8">

          <h1 className="text-2xl sm:text-3xl font-bold text-center">Welcome {authUser.fullName}</h1>
          <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6">Complete Your Profile</h1>

          <form onSubmit={handleSubmit} className="space-y-4" >
            {/* PROFILE PIC CONTAINER */}
            <div className="flex flex-col items-center justify-center space-y-3">
              {/* IMAGE PREVIEW */}
              <div className="size-32 rounded-full bg-base-300 overflow-hidden">
                {formState.profilePic ? (
                 <img 
                      src={formState.profilePic}
                      alt="Profile Preview"
                      className="w-full h-full object-cover"    
                 />
                ) : (
               <div className="flex items-center justify-center h-full">
                  <CameraIcon className="size-12 text-base-content opacity-40"/>
               </div>
              )}
              </div>

              {/* GENERATE RANDOM AVATAR BUTTON */}

              <div className="flex items-center gap-2">
                <button type="button" onClick={handleRandomAvatar} className="btn btn-accent" disabled={avatarLoading}>
                  {avatarLoading ? (
                    <LoaderIcon className="animate-spin size-4 mr-2" />
                  ) : (
                    <ShuffleIcon className="size-4 mr-2"/>
                  )}
                  
                  Generate Random Avatar
                </button>
              </div>
            </div>

              {/* USER NAME */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Profile Name</span>
                </label>
                <input 
                  type="text"
                  name="userName"
                  value={formState.userName}
                  onChange={(e) => setFormState({...formState, userName: e.target.value})}
                  className="input input-bordered w-full"
                  placeholder="Your profile name" 
                />
              </div>

              {/* BIO */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Bio</span>
                </label>
                <textarea 
                  name="bio"
                  value={formState.bio}
                  onChange={(e) => setFormState({...formState, bio: e.target.value})}
                  className="textarea textarea-bordered h-18 w-full"
                  placeholder="Tell others about yourself" 
                />
              </div>

              {/* LANGAUGES */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* NATIVE LANGUAGE */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Native Language</span>
                  </label>
                  <select 
                    name="nativeLanguage" 
                    value={formState.nativeLanguage}
                    onChange={(e)=>setFormState({...formState, nativeLanguage: e.target.value})}
                    className="select select-bordered w-full"
                    >
                      <option value="">Select your native language</option>
                      {LANGUAGES.map((lang) => (
                        <option key={`native-${lang}`} value={lang.toLowerCase()}>
                          {lang}
                        </option>
                      ))}
                    </select>
                </div>

                {/* LEARNING LANGUAGE */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Learning Language</span>
                  </label>
                  <select 
                    name="learningLanguage" 
                    value={formState.learningLanguage}
                    onChange={(e)=>setFormState({...formState, learningLanguage: e.target.value})}
                    className="select select-bordered w-full"
                    >
                      <option value="">Select your learning language</option>
                      {LANGUAGES.map((lang) => (
                        <option key={`learning-${lang}`} value={lang.toLowerCase()}>
                          {lang}
                        </option>
                      ))}
                    </select>
                </div>
              </div>

              {/* LOCATION */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Location</span>
                </label>
                <div className="relative">
                  <MapPinIcon className="absolute top-1/2 transform -translate-y-1/2
                  left-3 size-5 text-base-content opacity-70 z-2"/>
                  <input 
                    type="text" 
                    name="location"
                    value={formState.location}
                    onChange={(e)=>setFormState({ ...formState, location: e.target.value })}
                    className="input input-bordered w-full pl-10"
                    placeholder="City, Country"
                  />
                </div>
              </div>

              {/* SUBMIT BUTTON */}
              <button className="btn btn-primary w-full" disabled={isPending} type="submit">
                {!isPending ? (
                  <>
                  <GlobeIcon className="size-5 mr-2"/>
                    Complete Onboarding
                  </>
                ):(
                  <>
                    <LoaderIcon className="animate-spin size-5 mr-2"/>
                    Complete Onboarding
                  </>
                )}
              </button>

          </form>
        </div>
      </div>
    </div>
  )
}

export default OnboardingPage